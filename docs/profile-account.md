# Tela de Perfil — Conta (senha, e-mail, MFA)

Integração da tela de perfil com o Cognito. Complementa [auth-cognito.md](./auth-cognito.md).

Branch: `CU-86e1yz1tp_Integration-Profile-Screen`.

---

## O que foi implementado

### Backend

Operações **self-service** (usuário autenticado, via **access token** do cookie) — diferente do
`AuthController`, que opera sobre challenges de login (session + SECRET_HASH).

- **`AccountController`** (`/api/account`, autenticado):
  | Método | Rota | Body | Resposta |
  |---|---|---|---|
  | POST | `/api/account/password` | `{currentPassword, newPassword}` | 204 |
  | PATCH | `/api/account/profile` | `{firstName, lastName, email}` | 204 |
  | GET | `/api/account/mfa` | — | `{enabled}` |
  | POST | `/api/account/mfa/setup` | — | `{otpauthUri}` |
  | POST | `/api/account/mfa/verify` | `{code}` | 204 |
- **`PATCH /profile`** atualiza nome **e/ou** e-mail num único request (casa com o botão "Salvar
  alterações"). Só toca o que mudou. A unicidade do e-mail é checada no banco **antes** de qualquer
  escrita no Cognito (ver pendência #1, resolvida).
- **`CognitoAuthService`** — métodos por access token: `changePassword`, `updateEmail`
  (via `adminUpdateUserAttributes`, marca `email_verified=true`, sem código), `updateName`
  (via `adminUpdateUserAttributes` em `given_name`/`family_name`), `isMfaEnabled`,
  `startMfaDeviceSetup`, `verifyAndEnableMfaDevice`, helper `setSoftwareTokenMfaPreferred`.
- **`UserService`** — `updateEmail`/`updateName` sincronizam o registro local; `ensureEmailAvailable`
  faz a checagem de unicidade (409) reusada antes do Cognito.
- **`AuthController` / `/refresh`** — passou a usar o cookie **`cognito_sub`** (gravado no login)
  em vez do `?email=`, desacoplando a sessão do e-mail. Fallback transitório pelo e-mail mantido.

### Frontend

- `api/account.ts` — client dos endpoints (`updateProfile`, `changePassword`, MFA).
- `Profile/ChangePasswordCard.tsx`, `Profile/ProfileForm.tsx` (Nome, Sobrenome e e-mail editáveis,
  salvos num único `PATCH`), `Profile/MfaCard.tsx`.
- `MFAVerificationForm` ganhou prop `backLabel` (reuso fora do login).
- `AuthContext`/`AuthProvider` — novo `refreshUser()`.

---

## ⚠️ Pontos de atenção (pendências para continuar)

### 1. Drift na troca de e-mail (transacional) — **resolvido**
`PATCH /profile` chama `userService.ensureEmailAvailable` (checagem de unicidade no banco) **antes**
de qualquer escrita no Cognito. Assim o 409 acontece antes de mutar o Cognito, eliminando o drift.
Resta a janela teórica de o `updateEmail` no banco falhar por outro motivo após o Cognito — improvável.

### 2. Edição de nome — **implementada**
`PATCH /profile` aceita `firstName`/`lastName` e atualiza `given_name`/`family_name` no Cognito
(`adminUpdateUserAttributes`) + sync no banco (`UserService.updateName`). No `ProfileForm` os campos
Nome e Sobrenome são editáveis. Obs.: o `CognitoUserSyncFilter` só lê atributos do Cognito **na criação**
do usuário; a sincronia pós-edição é feita aqui no próprio endpoint, não por re-leitura do filtro.

### 3. Desabilitar MFA — **decisão de produto: não implementado**
Pool tem `MfaConfiguration: ON` (MFA obrigatório). Só existe configurar/trocar dispositivo, sem `DELETE`.
→ Se o pool virar `OPTIONAL`, reavaliar e possivelmente expor disable.

### 4. Detecção de status de MFA depende do pool `ON`
`UserMFASettingList` só é populado por `SetUserMFAPreference`. O setup antigo do login não chamava —
por isso a lista fica `null` para usuários antigos. `isMfaEnabled` tem fallback: se o pool é `ON`,
retorna `true` (usuário autenticado já passou pelo TOTP). O `completeMfaSetup` agora grava a preferência
(best-effort) e o fluxo do perfil também. **Se o pool virar `OPTIONAL`, o status volta a depender da lista** —
usuários antigos só ficam corretos após próximo login/troca de dispositivo.

### 5. `extractSub` não valida assinatura do JWT — **proposital**
Em `AuthController`, ao gravar o cookie `cognito_sub`, o `sub` é lido do payload do access token **sem validar**.
É seguro porque o token acabou de vir do Cognito (server-to-server). A validação real continua em todo request
protegido (resource server + JWKS). Não usar esse parsing para tomar decisão de autorização.

### 6. Fallback por e-mail no `/refresh` — **remover depois**
Mantido só para sessões abertas **antes** do deploy do cookie `cognito_sub`. Pode ser removido depois
que as sessões antigas expirarem (refresh token = 30 dias).

### 7. `AUTH_EMAIL_KEY` no front — **redundante agora**
Com o cookie `cognito_sub`, o refresh não depende mais do e-mail. O front ainda grava/atualiza o
`localStorage[AUTH_EMAIL_KEY]`, mas é limpeza opcional.

### 8. Spring Boot 4 — sem bean `ObjectMapper`
O projeto usa starters modulares do Boot 4 (`spring-boot-starter-webmvc`), que **não** trazem o
`spring-boot-starter-json`. Por isso não há bean `ObjectMapper` para injetar — em `AuthController` foi usada
uma instância estática. Se precisar do bean em mais lugares, adicionar `spring-boot-starter-json` no pom.

### 9. Validação ainda pendente
- Front: `eslint` 0 erros e `tsc -b` ok, mas **`vite build` completo e validação visual não rodados**.
- **Endpoints não testados ao vivo** (login → cookie → account/*).
- **Sem testes** (unit/integration) para o código novo.

---

## Como rodar localmente

```bash
docker compose --profile dev up backend-dev
```

Pré-requisitos (já configurados no `.env`, gitignored):
- `SECURITY_AUTH_DISABLED=false` (auth ligada — necessária para os endpoints de conta)
- `AWS_PROFILE=wsssguardo` + `~/.aws` montado no container (linha 84 do compose) — necessário para
  `adminUpdateUserAttributes` / `ListUsers` / `getUserPoolMfaConfig`
- `COGNITO_*` reais

> Com `SECURITY_AUTH_DISABLED=true` **não dá para testar** os endpoints de conta (não há access token/usuário).
> Se o boot der `Read timed out` no `.well-known/openid-configuration`, é rede transitória até a AWS — subir de novo.

### Testar os endpoints (autenticado + CSRF)
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"...","password":"..."}'
# (completar /api/auth/mfa-verify se vier MFA_REQUIRED)
XSRF=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')
curl -b cookies.txt http://localhost:8080/api/account/mfa -H "X-XSRF-TOKEN: $XSRF"
```

## Referência do pool (dev)
- Pool: `us-east-2_r2QdnAcEo` · região `us-east-2` · `MfaConfiguration: ON` · SoftwareTokenMfa habilitado.
