# Arquivamento — Criptografia (AES vs RSA, detalhes técnicos)

Referência técnica do esquema criptográfico do arquivamento de projetos: **o que cada algoritmo
faz, quando se usa AES e quando se usa RSA, e por quê**. Complementa o design em
[project-archival.md](./project-archival.md) e o guia de front em [archive-frontend-guide.md](./archive-frontend-guide.md).

Fonte de verdade é o código:
- `backend/src/main/java/wsssguardo/archive/crypto/ArchiveCryptoService.java` — pipeline cripto.
- `.../crypto/FileArchiveKeyProvider.java` — carga das chaves.
- `.../crypto/ArchiveKeyMaterial.java` — material de chave.
- `.../service/ArchiveServiceImpl.java` — orquestração + hash SHA-256.

---

## TL;DR — quando AES e quando RSA

| Algoritmo | Onde entra | Para quê | Por que esse e não o outro |
|---|---|---|---|
| **AES-256-CBC** (simétrico) | Cifragem do **conteúdo** do envelope (CMS EnvelopedData) | Confidencialidade do dump (que pode ter MBs) | Simétrico é ordens de grandeza mais rápido e **não tem limite de tamanho** de entrada. É a "carga". |
| **RSA-OAEP** (assimétrico) | Embrulho (**key transport**) da chave AES aleatória | Entregar a chave AES só para quem tem a privada do cofre | RSA só cifra blocos pequenos (≤ tamanho da chave). Cifra **apenas a chave AES de 32 bytes**, não o dump. |
| **SHA256withRSA** (assimétrico) | **Assinatura** do dump (CMS SignedData) | Integridade + autenticidade/origem | Assinatura precisa de chave assimétrica: só o servidor assina, qualquer um verifica com o cert público. |
| **SHA-256** (hash) | Digest do `.p7m` gravado no `ArchiveManifest` e gate da purga | Provar que o backup baixado == o gerado, antes de apagar | Hash, não cripto: detecta divergência/corrupção do download. |

**Regra mental:** RSA nunca toca os dados grandes. AES cifra os dados; RSA cifra a *chave* do AES
(criptografia **híbrida**) e, separadamente, **assina** o conteúdo.

---

## 1. Por que criptografia híbrida (AES + RSA juntos)

RSA não foi feito para cifrar payloads grandes: o tamanho máximo de entrada é limitado pelo tamanho
da chave (uma chave RSA-3072 com OAEP/SHA-256 cifra no máximo ~318 bytes). O dump de um projeto pode
ter megabytes. A solução padrão (e a que o CMS/PKCS#7 implementa) é **híbrida**:

1. Gera-se uma **chave AES aleatória de 256 bits** por arquivo (a *content-encryption key*, CEK).
2. **AES-256-CBC** cifra o conteúdo inteiro com essa CEK — rápido, sem limite de tamanho.
3. **RSA-OAEP** cifra **só a CEK** (32 bytes) com a chave pública do cofre — *key transport*.
4. O `.p7m` carrega o conteúdo cifrado + a CEK embrulhada. Só quem tem a **privada do cofre**
   desembrulha a CEK e, com ela, decifra o conteúdo.

A CEK é gerada e descartada a cada arquivamento pelo `JceCMSContentEncryptorBuilder(AES256_CBC)` —
nunca é persistida em claro.

## 2. Os dois papéis distintos do RSA

É importante não confundir: o RSA aparece **duas vezes, com pares de chaves diferentes**.

### 2.1. RSA para assinar (SignedData) — `SHA256withRSA`
- **Chave:** privada **de assinatura do servidor** (`signingKey` em `ArchiveKeyMaterial`).
- **Faz:** calcula `SHA-256` do JSON e assina o digest com a privada do servidor.
- **Garante:** integridade (o conteúdo não foi alterado) + autenticidade (foi este servidor que gerou).
- **Verifica-se com:** o **certificado público do servidor**, que viaja embutido no próprio
  SignedData (`gen.addCertificate(...)`), então o verificador nem precisa tê-lo de antemão.

### 2.2. RSA para cifrar a chave AES (EnvelopedData) — `RSA-OAEP`
- **Chave:** pública **do cofre** (`recipientCertificate`).
- **Faz:** embrulha a CEK AES com RSAES-OAEP (padding `MGF1` + `SHA-256`, `PSpecified.DEFAULT`).
- **Garante:** só a **privada do cofre** (offline/air-gapped) desembrulha a CEK → confidencialidade.
- **Propriedade central:** o servidor **não consegue decifrar o que produziu** — ele só tem a
  pública do cofre. Comprometer o servidor não expõe os arquivos já arquivados.

> Pares de chave **separados** de propósito: assinatura (servidor) e cifragem (cofre) têm donos,
> ciclos de vida e locais de guarda diferentes. Ver inventário na §4.

## 3. Pipeline exato (signed-then-enveloped)

`ArchiveServiceImpl.archiveProject` → `ArchiveCryptoService.signAndEnvelope(plainJson)`:

```
JSON canônico (UTF-8, chaves ordenadas, determinístico)
   │
   │  sign()  —  CMSSignedDataGenerator
   ▼
CMS SignedData            assinatura SHA256withRSA (privada do servidor),
(conteúdo encapsulado)    + cert do servidor embutido p/ verificação
   │
   │  envelope()  —  CMSEnvelopedDataGenerator
   ▼
CMS EnvelopedData         conteúdo cifrado com AES-256-CBC (CEK aleatória),
(.p7m, DER)               CEK embrulhada com RSA-OAEP (cert do cofre)
   │
   ▼
bytes .p7m  ──►  SHA-256 hex (ArchiveManifest.sha256)  ──►  download project-{id}-{ts}.p7m
```

**Ordem importa: assina ANTES de cifrar** (*sign-then-encrypt*). Assim a assinatura cobre o JSON em
claro e quem decifra ainda precisa validar a assinatura — e a existência da assinatura não vaza para
quem não consegue decifrar.

### Parâmetros precisos (do código)

| Item | Valor | Local |
|---|---|---|
| Assinatura | `SHA256withRSA` | `ArchiveCryptoService.sign()` (`JcaContentSignerBuilder`) |
| Cifra de conteúdo | `AES-256-CBC` (`CMSAlgorithm.AES256_CBC`) | `ArchiveCryptoService.envelope()` |
| Key transport | `RSAES-OAEP`, MGF1+SHA-256, `PSpecified.DEFAULT` | `envelope()` (`id_RSAES_OAEP`) |
| Provider | Bouncy Castle (`BouncyCastleProvider`) | bloco `static` do service |
| Encapsulamento | SignedData com conteúdo embutido (`generate(msg, true)`) | `sign()` |
| Formato de saída | DER (`.getEncoded()`), MIME `application/pkcs7-mime` | `envelope()` / `ArchiveController` |
| Hash do manifesto | `SHA-256` hex do `.p7m` | `ArchiveServiceImpl.sha256Hex()` |
| Tamanho da CEK | 256 bits (implícito no AES256_CBC, gerada pelo CMS) | `JceCMSContentEncryptorBuilder` |

## 4. Inventário de chaves e onde moram

`ArchiveKeyMaterial` = `(signingKey, signerCertificate, recipientCertificate)`. Carregado por
`FileArchiveKeyProvider` a partir de:
- **Keystore PKCS#12** (`archive.signing.*`): contém a **privada de assinatura do servidor** + seu cert.
- **Certificado X.509** PEM/DER (`archive.recipient.certificate-path`): a **pública do cofre**.

| Chave | Tipo | Onde mora | Arquivo dev (`backend/dev-keys/`) | Env de produção |
|---|---|---|---|---|
| Privada de assinatura (servidor) | RSA privada | **no servidor**, dentro do `.p12` | `signer.p12` (alias `archive-signer`) | `ARCHIVE_SIGNING_KEYSTORE_PATH` / `_PASSWORD` / `_KEY_ALIAS` / `_KEY_PASSWORD` |
| Cert público de assinatura (servidor) | X.509 | no `.p12` + distribuído a quem verifica | `signer.crt` | (embutido no SignedData) |
| Cert público do cofre (recipiente) | X.509 | no servidor (só a pública!) | `vault-public.crt` | `ARCHIVE_RECIPIENT_CERTIFICATE_PATH` |
| **Privada do cofre** | RSA privada | **OFFLINE / air-gapped — nunca no servidor** | `vault-private.pem` (só p/ teste local) | nunca no servidor |

Config em `application.properties` (linhas 38–42), todas via env, sem segredo no repo:

```properties
archive.signing.keystore-path=${ARCHIVE_SIGNING_KEYSTORE_PATH:}
archive.signing.keystore-password=${ARCHIVE_SIGNING_KEYSTORE_PASSWORD:}
archive.signing.key-alias=${ARCHIVE_SIGNING_KEY_ALIAS:}
archive.signing.key-password=${ARCHIVE_SIGNING_KEY_PASSWORD:}
archive.recipient.certificate-path=${ARCHIVE_RECIPIENT_CERTIFICATE_PATH:}
```

No `docker-compose.yml` (`backend-dev`), `./backend/dev-keys` é montado em `/keys:ro` e as envs têm
defaults (`/keys/signer.p12`, senha `changeit`, alias `archive-signer`, `/keys/vault-public.crt`).

**Degradação graciosa:** se keystore/alias/cert do cofre não estão configurados,
`FileArchiveKeyProvider.get()` lança **503** *no momento de arquivar* — a aplicação sobe normalmente
sem as chaves; só a operação de arquivamento fica indisponível.

## 5. Restore (independente do nosso código)

O `.p7m` é interoperável com `openssl cms`. Decifra-se com a **privada do cofre** e verifica-se com o
**cert público do servidor** — provando que o arquivo é auto-contido:

```bash
# 1. Decifrar (RSA-OAEP desembrulha a CEK; AES-256-CBC decifra o conteúdo)
openssl cms -decrypt -in project-{id}-{ts}.p7m -inform DER \
  -inkey vault-private.pem -out signed.p7s

# 2. Verificar a assinatura (SHA256withRSA) e extrair o JSON
openssl cms -verify -in signed.p7s -inform DER -certfile signer.crt -out projeto.json
```

(No fluxo dev do `project-archival.md` §9 isso aparece encadeado num pipe único.)

## 6. Garantias e limites

- **Confidencialidade:** AES-256-CBC + CEK embrulhada por RSA-OAEP. Só a privada do cofre abre.
- **Integridade + origem:** SignedData `SHA256withRSA` com cert do servidor embutido.
- **Anti-corrupção do backup:** `confirm` recalcula o SHA-256 do arquivo baixado e compara com o
  `ArchiveManifest`; divergência **aborta a purga** (`ArchiveServiceImpl.confirmArchive`).
- **Servidor não decifra o próprio output:** não possui a privada do cofre.
- **Limite conhecido — AES-CBC não é autenticado:** ao contrário do GCM, o CBC não traz tag de
  autenticação própria. Aqui a integridade vem da **camada SignedData** (assinatura RSA sobre o
  conteúdo), que é verificada no restore — então o esquema continua íntegro ponta-a-ponta. Ainda
  assim, decifrar **sem** verificar a assinatura não dá garantia de integridade; **sempre** rodar o
  `cms -verify`. Migrar o conteúdo para AES-GCM (AEAD) é uma melhoria possível.
- **Perda da privada do cofre = arquivos irrecuperáveis.** Custódia/rotação são pré-requisito
  operacional (ver `project-archival.md` §11).

## 7. Notas de divergência (doc × código)

- O design `project-archival.md` cita **AES-256-GCM**; a implementação usa **AES-256-CBC**
  (`CMSAlgorithm.AES256_CBC`). Este documento reflete o código. (As menções a GCM no design foram
  ajustadas para CBC.)
- Tamanho de chave RSA: os exemplos `openssl` do design usam `rsa:3072`; os testes
  (`ArchiveTestKeys`) geram `RSA 2048` em memória. O código não fixa tamanho — usa o que estiver na
  chave/cert configurados. Recomenda-se **≥ 3072 bits** em produção.
- Migration do manifesto: `0013-create-archive-manifests.xml` (o design menciona `0012`).
