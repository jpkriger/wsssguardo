# Arquivamento Seguro de Projetos

Documento de design da feature que permite **arquivar um projeto** ao final do seu ciclo: gerar um dump completo e auto-contido, **assinar + criptografar** com certificado, baixar para guarda em local seguro (cold storage / air-gapped) e, após confirmação do backup, purgar as linhas do banco operacional.

> Status: **design aprovado** — implementação em etapas posteriores. Este documento é a fonte de verdade do contrato e do modelo de segurança.

---

## 1. Motivação

Quando um projeto encerra, queremos:

1. Preservar **tudo** que pertence a ele (dados + ativos + artefatos + achados + riscos + configuração + trilha de auditoria) num único arquivo.
2. Garantir que esse arquivo seja **confidencial, íntegro e de origem comprovável** por anos, **sem depender** do sistema que o gerou.
3. Liberar o banco operacional sem risco de perda acidental.

Dois problemas centrais moldam o design:

- **Engenharia:** o grafo JPA do projeto tem ciclos e referências compartilhadas (`Asset`/`Artifact`/`Find`/`Risk` apontam de volta para `Project` e entre si). Serializar `@Entity` direto causaria `StackOverflow` e duplicação massiva.
- **Segurança:** o dump contém dados sensíveis de segurança da informação; precisa de sigilo + integridade + autenticidade de longo prazo, em formato padrão e independente de fornecedor.

## 2. Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Modelo de chave/cripto | **Certificado X.509 offline** (CMS/PKCS#7, Bouncy Castle) | Servidor só tem a chave pública do cofre; a privada fica air-gapped. Restaura com `openssl cms`. Casa com "baixar e guardar". |
| Garantia criptográfica | **Assinar + encriptar** (CMS SignedData + EnvelopedData) | Sigilo **e** integridade **e** prova de origem. |
| Pós-arquivamento | **Marcar `ARCHIVED` → dump → download confirmado → purgar** | Dois passos; sem perda acidental se o download falhar. |
| Soft-deleted | **Incluir tombstones** (registros com `deleted_at`) | Histórico forense completo no archive. |

## 3. Fluxo end-to-end

```
[Botão "Arquivar projeto"]  (somente MANAGER)
        │
        ▼
1. POST /api/projects/{id}/archive
   ├─ assertManager()
   ├─ valida status (ex.: COMPLETED/CANCELLED) e que não está já ARCHIVED
   ├─ status := ARCHIVED  (soft, transacional)
   ├─ ProjectArchiveExporter → agregado NORMALIZADO (sem redundância, com tombstones)
   ├─ Jackson → JSON canônico (ordenado, determinístico)
   ├─ ArchiveCryptoService:
   │     SHA-256 → CMS SignedData (chave privada de assinatura do servidor)
   │                 → CMS EnvelopedData (cert público do cofre, AES-256-GCM + RSA-OAEP)
   │     → bytes .p7m
   ├─ persiste ArchiveManifest (id, projectId, sha256, tamanho, quem, quando, status=PENDING_DOWNLOAD)
   └─ download: project-{id}-{timestamp}.p7m  (application/pkcs7-mime, attachment)
        │
        ▼
2. (offline) operador guarda o .p7m no cofre e valida que abre (ver §7)
        │
        ▼
3. POST /api/projects/{id}/archive/confirm   (somente MANAGER)
   ├─ recebe o sha256 do arquivo baixado e compara com o ArchiveManifest
   ├─ marca ArchiveManifest.status := CONFIRMED
   └─ PURGA (hard delete) projeto + filhos, transacional, respeitando FKs
```

**Por que dois passos:** purgar no mesmo request do dump é irreversível e arriscado (o download pode falhar ou corromper). O `confirm` exige reapresentar o hash do arquivo efetivamente baixado, garantindo que só purgamos quando há backup íntegro guardado.

## 4. Formato do dump — JSON normalizado (zero redundância)

Princípio: **cada entidade aparece exatamente uma vez** numa lista própria; todo relacionamento é representado por **id**, nunca por objeto aninhado. É um mini-dump relacional. Cada registro carrega o bloco `audit` do `BaseEntity` (`createdAt, updatedAt, deletedAt, createdBy, lastModifiedBy, deletedBy`) — o que também identifica tombstones.

### Regras de normalização

1. **Nunca serializar `@Entity`.** DTOs de export dedicados (resolve ciclo, lazy-loading, proxies Hibernate).
2. **Relacionamento = id.** Em `Find`: `assets`→`assetIds`, `artifacts`→`artifactIds`, `categories`→`categoryIds`. O objeto completo só vive na sua lista raiz. Elimina o "diamante" (um asset ligado a N finds apareceria N+1 vezes).
3. **M2M `risks_finds` com UM dono.** Guardar `findIds` dentro de cada `Risk`; **não** repetir `riskIds` em `Find` (hoje a relação é bidirecional `Risk.finds` ⟷ `Find.risks`).
4. **Owned vs. compartilhado.** Owned (cascade ALL) = dump completo: `ProjectUser, Asset, Artifact, Find, Risk`. Compartilhado = só snapshot em `references`: `Company, User, FindCategory` (essas entidades vivem além do projeto — dumpar o grafo inteiro estaria errado e explodiria).
5. **Determinístico.** Ordenar todas as listas por `id` e serializar com chaves ordenadas — o hash/assinatura precisam ser reproduzíveis.

### Estrutura

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-06-05T12:00:00Z",
  "includesTombstones": true,
  "project": {
    "id": "...", "name": "...", "status": "ARCHIVED",
    "startDate": "...", "endDate": "...", "companyId": "...",
    "configuration": { /* jsonb ProjectConfiguration, inline */ },
    "audit": { "createdAt": "...", "deletedAt": null, "createdBy": "..." }
  },
  "assets":    [ { "id": "a1", "name": "...", "description": "...", "content": "...", "audit": {} } ],
  "artifacts": [ { "id": "f1", "name": "...", "type": "...", "category": "...", "driveLink": "...", "llmSummary": "...", "content": "...", "audit": {} } ],
  "finds": [
    { "id": "fd1", "name": "...", "categoricalSeverity": "...", "numericSeverity": 0,
      "quantitativeCriticality": 0, "sector": "...", "threatEvent": "...", "reference": "...",
      "recommendation": "...", "description": "...",
      "assetIds": ["a1"], "artifactIds": ["f1"], "categoryIds": ["c1"], "audit": {} }
  ],
  "risks": [
    { "id": "r1", "name": "...", "description": "...", "consequences": "...",
      "occurrenceProbability": 0.0, "impactProbability": 0.0, "riskLevel": 4200,
      "damageOperations": "...", "damageIndividuals": "...", "damageOtherOrgs": "...",
      "recommendation": "...", "findIds": ["fd1"], "audit": {} }
  ],
  "projectUsers": [ { "id": "pu1", "userId": "u1", "audit": {} } ],

  "references": {
    "companies":      [ { "id": "...", "name": "..." } ],
    "users":          [ { "id": "u1", "name": "...", "email": "...", "role": "..." } ],
    "findCategories": [ { "id": "c1", "name": "..." } ]
  }
}
```

### Tombstones — furando o `@SQLRestriction`

`BaseEntity` declara `@SQLRestriction("deleted_at IS NULL")`, que o Hibernate aplica **sempre** e não dá para desabilitar por query (ao contrário de `@Filter`). Para incluir os deletados no archive:

- Cada entidade owned ganha uma **query nativa de export** no repositório, ex.:
  `@Query(value = "SELECT * FROM assets WHERE project_id = :pid", nativeQuery = true)` → traz inclusive `deleted_at IS NOT NULL`.
- A join `risks_finds` (sem soft-delete) é lida via SQL nativo.
- O bloco `audit.deletedAt/deletedBy` identifica cada tombstone no dump.

## 5. Modelo de segurança

### Inventário de chaves

| Chave | Onde mora | Uso |
|---|---|---|
| **Chave privada de assinatura do servidor** | Servidor, em keystore/secret (**nunca** em código/repo) | Assinar o dump (SignedData) |
| Cert público de assinatura do servidor | Distribuído aos verificadores | Verificar a assinatura no restore |
| **Cert público do cofre (recipiente)** | Servidor (config) | Encriptar (EnvelopedData) |
| **Chave privada do cofre** | **Offline / air-gapped — nunca toca o servidor** | Decriptar no restore |

Propriedade-chave: o servidor **não consegue decriptar** o que produziu (só tem a pública do cofre). Comprometer o servidor não expõe os arquivos arquivados.

### Camadas CMS

1. `JSON (UTF-8)` → SHA-256 → **CMS SignedData** assinado com a privada do servidor (`SHA256withRSA`).
2. SignedData → **CMS EnvelopedData**: gera chave AES-256-GCM aleatória, encripta o conteúdo; encripta a chave AES com RSA-OAEP usando o cert do cofre.
3. Saída `.p7m` (DER), interoperável com `openssl cms`.

### Checklist de controles

- **Autorização:** todos os endpoints exigem `assertManager()` (`ProjectAccessService`); arquivar/purgar é só de gestor.
- **CSRF:** os POSTs passam pela proteção CSRF de cookie existente (não estão na allowlist de `/api/auth/**`).
- **Sem segredo em repo:** caminhos de keystore/cert e senhas via env/secret; `application.properties` só referencia placeholders. Custódia documentada em `docs/ec2-backend.md`.
- **Transacionalidade:** `archive` (status + manifest) e `confirm/purge` em transações separadas e atômicas.
- **Hash gate na purga:** `confirm` compara o sha256 informado com o do `ArchiveManifest`; divergência aborta a purga.
- **Auditoria permanente:** `ArchiveManifest` registra quem/quando/hash/tamanho/status — trilha que sobrevive à purga das linhas do projeto.
- **Memória:** dumps grandes via `StreamingResponseBody`; avaliar limite de tamanho.
- **Erros padronizados:** falhas de cripto/serialização passam pelo `GlobalExceptionHandler`.

## 6. Contrato de API

| Método | Rota | Auth | Corpo | Resposta |
|---|---|---|---|---|
| `POST` | `/api/projects/{id}/archive` | MANAGER | — | `200` download `application/pkcs7-mime` (`project-{id}-{ts}.p7m`); efeito: status `ARCHIVED` + manifest `PENDING_DOWNLOAD` |
| `POST` | `/api/projects/{id}/archive/confirm` | MANAGER | `{ "sha256": "..." }` | `204` se hash confere (purga); `4xx` se diverge (sem purgar) |
| `GET` | `/api/projects/{id}/archive/manifest` | MANAGER | — | `200` status do arquivamento (opcional) |

## 7. Restore (fora do sistema)

Prova de que o arquivo é auto-contido e independente do nosso código:

```bash
# 1. Decripta com a chave privada do cofre (offline)
openssl cms -decrypt -in project-{id}-{ts}.p7m -inkey cofre-privada.pem -out signed.p7s

# 2. Verifica a assinatura com o cert público do servidor e extrai o JSON
openssl cms -verify -in signed.p7s -inform DER -certfile servidor-pub.pem -out projeto.json
```

A restauração para dentro do banco (re-inserção) usa a estrutura normalizada: inserir cada lista raiz e depois resolver as referências por id.

## 8. Componentes de implementação

Nova feature `archive` (+ ajustes pontuais em `project`), seguindo a arquitetura por feature do `AGENTS.md` (entidade/DTO/mapper/repository/service interface+impl/controller/migration/testes).

**Backend**
- `project/domain/ProjectStatus.java`: adicionar `ARCHIVED`.
- `backend/pom.xml`: dependência Bouncy Castle `bcpkix-jdk18on`.
- `archive/` — entidade `ArchiveManifest` + migration Liquibase `0012-create-archive-manifests.xml`.
- `archive/dto/export/` — `ProjectArchiveDTO` (raiz) + `AssetExportDTO`, `ArtifactExportDTO`, `FindExportDTO`, `RiskExportDTO`, `ProjectUserExportDTO`, `AuditDTO`, `ReferencesDTO` (records imutáveis; relacionamentos como `List<UUID>`).
- `archive/service/ProjectArchiveExporter` — monta o agregado normalizado (5 regras), via queries nativas com tombstones, ordenado por id.
- Queries nativas de export em `Asset/Artifact/Find/Risk/ProjectUser` + join `risks_finds`.
- `archive/service/ArchiveCryptoService` — JSON → SignedData → EnvelopedData (Bouncy Castle CMS); chaves via config.
- `archive/service/ArchiveService` (interface) + `ArchiveServiceImpl` — orquestra archive e confirm/purge.
- `archive/controller/ArchiveController` — os 3 endpoints da §6, com `assertManager()` e `@Valid`.
- `application.properties` — `archive.signing.keystore`, `archive.recipient.cert` (placeholders por env).

**Frontend**
- `src/api/archive.ts` — módulo API tipado (sem `fetch` em componente).
- Botão "Arquivar" na tela do projeto (só MANAGER), com estados loading/error/empty/success; dispara o download do `.p7m`.
- Modal de confirmação que coleta/reapresenta o hash e chama `/confirm`.

## 9. Testar localmente (passo a passo)

> **Rodar os testes automatizados não exige configuração** — eles geram chaves em memória.
> `cd backend && ./mvnw -o test -Dtest='ArchiveCryptoServiceTest,ExportDtoDriftGuardTest,ArchiveControllerIntegrationTest'`
>
> O passo a passo abaixo é para **testar a feature manualmente** com a aplicação rodando (curl + openssl).

### 9.1. Gerar as chaves (uma vez) em `backend/dev-keys/`

A pasta `backend/dev-keys/` já existe com um `.gitignore` que impede commitar chaves.

```bash
cd backend/dev-keys

# Chave de ASSINATURA do servidor → keystore PKCS#12 (fica NO servidor)
openssl req -x509 -newkey rsa:3072 -keyout signer.key -out signer.crt -days 3650 -nodes \
  -subj "/CN=wsssguardo-archive-signer"
openssl pkcs12 -export -inkey signer.key -in signer.crt -name archive-signer \
  -out signer.p12 -passout pass:changeit

# Chave do COFRE → só o .crt vai pro servidor; vault-private.pem fica OFFLINE (é o que decripta)
openssl req -x509 -newkey rsa:3072 -keyout vault-private.pem -out vault-public.crt -days 3650 -nodes \
  -subj "/CN=wsssguardo-archive-vault"
```

Os nomes/senha acima (`signer.p12`, alias `archive-signer`, senha `changeit`, `vault-public.crt`) são os **defaults** do `docker-compose.yml` (`backend-dev`). Usando-os, **não é preciso definir nenhuma env var** — basta gerar os arquivos.

### 9.2. Subir o ambiente dev

```bash
docker compose --profile dev up backend-dev db
```

Sobe com `SECURITY_AUTH_DISABLED=true` (bypassa `assertManager()` e desliga CSRF, permitindo testar via curl) e monta `backend/dev-keys/` em `/keys` no container.

### 9.3. Arquivar um projeto e baixar o `.p7m`

```bash
PID=$(curl -s localhost:8080/api/projects | jq -r '.[0].id')   # pega um projeto do seed
curl -s -X POST localhost:8080/api/projects/$PID/archive -o projeto.p7m
ls -l projeto.p7m                                              # arquivo cifrado (.p7m)
```

### 9.4. Provar que o dump abre (restore offline)

```bash
openssl cms -decrypt -in projeto.p7m -inform DER -inkey backend/dev-keys/vault-private.pem \
  | openssl cms -verify -inform DER -certfile backend/dev-keys/signer.crt -noverify 2>/dev/null \
  | jq .
```

Deve exibir o JSON normalizado (`schemaVersion`, `assets`, `finds` com `assetIds`, `risks` com `findIds`, `references`…).

### 9.5. Confirmar o backup e purgar

```bash
SHA=$(sha256sum projeto.p7m | cut -d' ' -f1)

# Hash errado → 400, nada é apagado
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/api/projects/$PID/archive/confirm \
  -H 'Content-Type: application/json' -d "{\"sha256\":\"$(printf '0%.0s' {1..64})\"}"   # 400

# Hash certo → 204, projeto purgado do Postgres
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/api/projects/$PID/archive/confirm \
  -H 'Content-Type: application/json' -d "{\"sha256\":\"$SHA\"}"                          # 204
```

### Resumo

| Cenário | O que precisa |
|---|---|
| Rodar os testes (`./mvnw test`) | **Nada** — chaves em memória |
| Testar manualmente (curl/app) | Só o `openssl` do 9.1 em `backend/dev-keys/` |
| Produção | As 5 env vars `ARCHIVE_*` apontando para keystore/cert reais (chave do cofre offline) |

## 10. Verificação

- **Unit:** `ProjectArchiveExporter` produz JSON normalizado, sem ciclos, com `findIds` só no lado Risk e com tombstones. `ArchiveCryptoService` round-trip (encripta→decripta com par de teste→JSON idêntico; assinatura verifica).
- **Integração (Testcontainers Postgres):** projeto completo → `POST /archive` retorna `.p7m` válido (decriptado/verificado no teste) + status `ARCHIVED` + manifest `PENDING_DOWNLOAD`; `confirm` com hash certo purga, com hash errado retorna `400` sem purgar; re-arquivar retorna `409`. (A restrição MANAGER vem do `ProjectAccessService`; não é exercida nos testes pois rodam com `security.auth.disabled=true`.)
- **Interop manual:** decriptar/verificar o `.p7m` com `openssl cms` e par de chaves de teste.
- **CI:** `./mvnw clean verify` (backend); `bun run lint && bun run test && bun run build` (frontend).

## 11. Riscos e pontos de atenção

- **Perda da chave privada do cofre = arquivos irrecuperáveis.** Custódia e rotação da chave do cofre são pré-requisito operacional.
- **Hard-delete vs. `@SQLRestriction`:** a purga usa SQL nativo (`DELETE`), respeitando a ordem de FKs: `risks_finds` → `risks`/`finds` → `assets`/`artifacts` → `project_users` → `project`.
- **`content` de Asset/Artifact pode ser grande (TEXT):** validar memória / preferir streaming.
- **Arquivo no cliente:** o `.p7m` já está cifrado; orientar (UI/doc) a não cachear nada em claro no navegador.
