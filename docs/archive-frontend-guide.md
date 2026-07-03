# Guia da Feature de Arquivamento — Para o Frontend

> Escrito para quem não implementou o backend mas precisa integrar a tela.
> Nenhum conhecimento de criptografia é necessário para entender o que fazer no front.

---

## O que essa feature faz, em termos simples

Quando um projeto termina, o gestor pode **arquivá-lo**. Isso significa:

1. O sistema gera um arquivo `.p7m` com todos os dados do projeto dentro (criptografado e assinado, como um cofre digital).
2. O gestor **baixa esse arquivo** e guarda em algum lugar seguro (um HD externo, um servidor offline, etc.).
3. O gestor **confirma** para o sistema que o backup foi feito, informando um código de verificação (SHA-256 — o sistema gerou esse código junto com o arquivo).
4. O sistema **apaga o projeto** do banco de dados, liberando espaço.

O resultado final: o projeto sumiu do sistema, mas existe uma cópia segura guardada pelo gestor.

---

## Por que dois passos (gerar + confirmar)?

Para evitar que o projeto seja apagado antes de ter certeza que o backup foi feito com sucesso. Se o arquivo não baixar, corromper, ou o gestor se arrepender, o projeto ainda está intacto no banco enquanto o gestor não confirmar.

---

## Quem pode fazer isso?

Apenas usuários com papel **MANAGER** no projeto.

---

## Os 3 endpoints do backend

### 1. Gerar o arquivo e baixar

```
POST /api/projects/{id}/archive
```

**Não precisa de corpo na requisição.**

**O que acontece no backend:**
- Marca o projeto como `ARCHIVED`
- Exporta todos os dados do projeto (ativos, artefatos, achados, riscos, usuários…)
- Criptografa tudo em um arquivo `.p7m`
- Salva internamente o hash SHA-256 do arquivo
- Retorna o arquivo para download

**Resposta de sucesso — `200 OK`:**
- `Content-Type: application/pkcs7-mime`
- `Content-Disposition: attachment; filename="project-{id}-{timestamp}.p7m"`
- Corpo: bytes do arquivo criptografado

**Respostas de erro:**
| Código | O que significa |
|--------|-----------------|
| `403`  | Usuário não é MANAGER |
| `404`  | Projeto não encontrado |
| `409`  | Projeto já está arquivado (não pode arquivar duas vezes) |
| `503`  | Backend sem as chaves criptográficas configuradas (problema de infra) |

---

### 2. Confirmar o backup e apagar o projeto

```
POST /api/projects/{id}/archive/confirm
Content-Type: application/json

{
  "sha256": "a3f2c1d4e5b6..."
}
```

O `sha256` é o código de verificação do arquivo que o gestor baixou. O frontend precisa calculá-lo no browser (ver seção "Como calcular o SHA-256 no browser" abaixo).

**O que acontece no backend:**
- Compara o hash enviado com o que salvou quando gerou o arquivo
- Se bater: marca como `CONFIRMED`, apaga o projeto e todos os dados relacionados (`204`)
- Se não bater: retorna erro, **nada é apagado** (`400`)

**Respostas:**
| Código | O que significa |
|--------|-----------------|
| `204`  | Confirmação aceita, projeto purgado |
| `400`  | Hash errado — arquivo pode estar corrompido ou ser o errado |
| `404`  | Nenhum arquivamento pendente encontrado |
| `403`  | Usuário não é MANAGER |

---

### 3. Consultar o status do arquivamento

```
GET /api/projects/{id}/archive/manifest
```

Retorna informações sobre o último arquivamento desse projeto.

**Resposta `200 OK`:**
```json
{
  "id": "uuid-do-manifest",
  "projectId": "uuid-do-projeto",
  "projectName": "Nome do Projeto",
  "fileName": "project-{id}-{timestamp}.p7m",
  "sha256": "a3f2c1d4e5b6...",
  "sizeBytes": 48302,
  "status": "PENDING_DOWNLOAD",
  "createdBy": "uuid-do-usuario",
  "createdAt": "2026-06-17T10:00:00Z",
  "confirmedBy": null,
  "confirmedAt": null
}
```

O campo `status` pode ser:
- `PENDING_DOWNLOAD` — arquivo gerado, aguardando confirmação do gestor
- `CONFIRMED` — backup confirmado, projeto apagado

**Resposta `404`:** nenhum arquivamento foi feito para esse projeto ainda.

---

## O fluxo completo na tela — o que o usuário vai ver

```
Tela do Projeto (somente MANAGER)
          │
          │ Botão "Arquivar Projeto"
          ▼
 [Modal de confirmação inicial]
  "Você tem certeza? O projeto será
   arquivado. Baixe o arquivo e guarde
   em local seguro."
          │
          │ Usuário clica "Confirmar e Baixar"
          ▼
 [Chamada: POST /api/projects/{id}/archive]
  → Download automático do .p7m começa
  → Projeto agora está marcado como ARCHIVED
          │
          ▼
 [Segunda tela / modal]
  "Arquivo baixado: project-{id}-{ts}.p7m
   
   Para finalizar, arraste o arquivo aqui
   para verificarmos que ele está íntegro:
   
   [  Drop zone / seletor de arquivo  ]
   
   Hash verificado: ✓ a3f2c1d4...
   
   [Botão: Confirmar backup e apagar projeto]"
          │
          │ Usuário solta o arquivo e clica confirmar
          ▼
 [Chamada: POST /api/projects/{id}/archive/confirm]
  → 204: Projeto removido. Redireciona para /projects
  → 400: "O arquivo não corresponde. Verifique se
          baixou o arquivo certo."
```

---

## Como calcular o SHA-256 no browser

O frontend precisa calcular o hash do arquivo `.p7m` **sem enviar o arquivo para o backend** — tudo acontece localmente no browser. Use a Web Crypto API nativa:

```typescript
async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

**Como usar:**
```typescript
// Quando o usuário seleciona ou arrasta o arquivo
const inputElement = document.getElementById("file-input") as HTMLInputElement;
const file = inputElement.files?.[0];

if (file) {
  const hash = await sha256Hex(file);
  // Mostra na tela para o usuário conferir
  setHashDisplay(hash);
  // Guarda para enviar no confirm
  setSha256ToConfirm(hash);
}
```

---

## Como fazer o download do arquivo

A resposta do `POST /archive` é um arquivo binário. Para disparar o download no browser:

```typescript
async function archiveProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/archive`, {
    method: "POST",
    // inclua headers de auth/CSRF aqui
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status}`);
  }

  // Converte a resposta em blob (arquivo binário)
  const blob = await response.blob();

  // Pega o nome do arquivo do header Content-Disposition
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match?.[1] ?? `project-${projectId}.p7m`;

  // Cria um link temporário e clica nele para baixar
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Estados que o projeto pode ter (relevante para a UI)

O projeto tem um campo `status`. Após o arquivamento:

| Status | O que mostrar na UI |
|--------|---------------------|
| `COMPLETED` ou `CANCELLED` | Botão "Arquivar" disponível para MANAGER |
| `ARCHIVED` | Badge "Arquivado", botão "Confirmar backup" se `manifest.status === PENDING_DOWNLOAD` |
| (não existe mais) | Projeto sumiu da listagem após o confirm |

---

## Checklist do que implementar no frontend

- [ ] Botão "Arquivar Projeto" visível apenas para MANAGER, nas telas onde o status permite (`COMPLETED`/`CANCELLED`)
- [ ] Modal de alerta antes de começar ("ação irreversível")
- [ ] Chamar `POST /archive` e disparar o download do `.p7m`
- [ ] Tela/modal de confirmação com drop zone para o arquivo
- [ ] Calcular SHA-256 do arquivo arrastado/selecionado usando `crypto.subtle`
- [ ] Mostrar o hash calculado na tela (para o gestor conferir visualmente)
- [ ] Botão "Confirmar e apagar" que chama `POST /archive/confirm` com o hash
- [ ] Tratar `400` (hash errado) com mensagem clara
- [ ] Tratar `409` (já arquivado) com mensagem clara
- [ ] Redirecionar para `/projects` após `204`
- [ ] Módulo de API tipado em `src/api/archive.ts` (não chamar `fetch` direto no componente)

---

## Exemplo de módulo de API (`src/api/archive.ts`)

```typescript
export interface ArchiveManifest {
  id: string;
  projectId: string;
  projectName: string;
  fileName: string;
  sha256: string;
  sizeBytes: number;
  status: "PENDING_DOWNLOAD" | "CONFIRMED";
  createdBy: string;
  createdAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

// Gera o dump e retorna o blob + nome do arquivo
export async function downloadProjectArchive(
  projectId: string
): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(`/api/projects/${projectId}/archive`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match?.[1] ?? `project-${projectId}.p7m`;
  return { blob, fileName };
}

// Confirma o backup com o hash do arquivo
export async function confirmArchive(
  projectId: string,
  sha256: string
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/archive/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha256 }),
  });
  if (!res.ok) throw new Error(String(res.status));
}

// Consulta o manifest (status do arquivamento)
export async function getArchiveManifest(
  projectId: string
): Promise<ArchiveManifest | null> {
  const res = await fetch(`/api/projects/${projectId}/archive/manifest`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

// Calcula o SHA-256 de um arquivo localmente (sem upload)
export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

---

## Perguntas frequentes

**O arquivo `.p7m` é seguro de guardar em qualquer lugar?**
Sim. Está criptografado — sem a chave privada do cofre (que só o time de infra tem, guardada offline), ninguém consegue abrir.

**O que acontece se o gestor fechar a aba depois de baixar mas antes de confirmar?**
Nada de grave. O projeto fica com status `ARCHIVED` e o manifest fica como `PENDING_DOWNLOAD`. O gestor pode voltar depois e confirmar usando o arquivo que já baixou. O botão "Confirmar backup" deve aparecer sempre que `manifest.status === 'PENDING_DOWNLOAD'`.

**O gestor pode gerar o arquivo duas vezes?**
Não. Se já está `ARCHIVED`, o backend retorna `409 Conflict`. Se precisar re-arquivar (cenário improvável), seria necessário uma operação administrativa direta no banco.

**O projeto some da listagem imediatamente ao clicar em "Arquivar"?**
Depende de como a listagem filtra — o projeto vai para status `ARCHIVED`. Se a listagem só mostra projetos ativos, ele some ali. Só é de fato deletado do banco após o `confirm`.
