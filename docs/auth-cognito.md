# Autenticação — Cognito + Backend Proxy

## Índice

1. [Por que essa arquitetura?](#1-por-que-essa-arquitetura)
2. [Por que cada configuração do Cognito?](#2-por-que-cada-configuração-do-cognito)
3. [Por que cada componente do backend?](#3-por-que-cada-componente-do-backend)
4. [Por que cada decisão de segurança?](#4-por-que-cada-decisão-de-segurança)
5. [Fluxos de autenticação](#5-fluxos-de-autenticação)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Próximos passos — Frontend](#7-próximos-passos--frontend)

---

## 1. Por que essa arquitetura?

### O problema: tokens no frontend são roubáveis

A abordagem mais simples seria usar o **AWS Amplify** no frontend: ele chama o Cognito diretamente, recebe os tokens e os armazena em `localStorage`. O problema é que, se qualquer script na página ler `localStorage`, os tokens vazam — e com um token válido, o atacante acessa a API como se fosse o usuário real.

Esse ataque chama-se **XSS (Cross-Site Scripting)**. Um único script malicioso injetado (via dependência comprometida, CDN, extensão do navegador) drena todos os tokens.

### A solução: backend proxy com cookies httpOnly

Nessa arquitetura, o **JavaScript nunca vê os tokens**. O fluxo é:

```
Browser → POST /api/auth/login → Backend → Cognito
                                         ↓
Browser ← Set-Cookie: access_token ← Backend ← tokens
```

O backend recebe os tokens do Cognito e os devolve como cookies `httpOnly`. A flag `httpOnly` instrui o browser a **nunca expor o cookie para JavaScript** — `document.cookie` não os retorna, nenhum script consegue lê-los.

### Por que não usar `Authorization: Bearer` no header?

Se o token ficasse num header, o JavaScript precisaria gerenciá-lo (armazenar, injetar em cada request). Voltaríamos ao problema do `localStorage`. Com cookies, o browser envia automaticamente — transparente para o JS.

### Comparação resumida

| Abordagem | Tokens no JS? | XSS vaza token? | Implementação |
|-----------|:---:|:---:|---|
| Amplify + localStorage | Sim | Sim | Simples |
| Amplify + sessionStorage | Sim | Sim | Simples |
| Backend proxy + httpOnly cookie | Não | Não | Mais complexa |

O app lida com dados de auditorias de segurança de empresas — a complexidade extra é justificada.

---

## 2. Por que cada configuração do Cognito?

### `username_attributes = ["email"]`

Usuários fazem login com email, não com um username inventado. Mais intuitivo e elimina a necessidade de gerenciar usernames separados.

### `mfa_configuration = "ON"` (não OPTIONAL)

Com `OPTIONAL`, o MFA seria opt-in. Usuários poderiam desabilitá-lo, e uma senha vazada seria suficiente para invasão. Com `ON`, o MFA é obrigatório para **todos** — senha comprometida não basta.

### `software_token_mfa_configuration { enabled = true }` (TOTP, sem SMS)

SMS tem dois problemas sérios:
1. **Custo**: cada mensagem custa dinheiro (SNS), especialmente internacionais.
2. **SIM Swap**: atacante convence a operadora a transferir o número para um chip dele. Depois disso, recebe todos os SMS da vítima — MFA por SMS vira zero.

TOTP (Google Authenticator, Authy) usa uma chave secreta local — não depende de operadora, não tem custo por uso, não é vulnerável a SIM Swap.

### `minimum_length = 12` + maiúscula + minúscula + número + símbolo

Senhas curtas são vulneráveis a **brute force** e **credential stuffing** (listas de senhas vazadas em outros sites). 12 caracteres com diversidade de tipos aumenta exponencialmente o espaço de busca.

### `allow_admin_create_user_only = true`

Usuários não podem se auto-registrar. Só o administrador cria contas. Motivo: o app é interno — consultores da empresa, não usuários públicos. Registro aberto significaria que qualquer pessoa poderia criar uma conta.

### `prevent_user_existence_errors = "ENABLED"`

Por padrão, o Cognito diferencia os erros: "usuário não existe" vs. "senha errada". Um atacante consegue montar uma lista de emails válidos apenas tentando logar. Com `ENABLED`, todos os erros retornam a mesma mensagem genérica — impossível distinguir se o email existe ou não (**account enumeration prevention**).

### `generate_secret = true` no App Client

O App Client tem um `client_secret`. Isso transforma o client num **cliente confidencial** — só servidores backend conseguem usá-lo, porque o secret fica numa variável de ambiente no servidor, nunca no browser.

Clientes públicos (SPAs, mobile) não podem ter secret porque o código é distribuído ao usuário. Aqui o backend é o único que chama o Cognito, então o secret é seguro.

### `access_token_validity = 1h`, `refresh_token_validity = 30d`

`access_token` curto (1h): se vazado, expira rápido. Limitação de dano.

`refresh_token` longo (30d): evita que o usuário precise fazer login todo dia. O refresh acontece silenciosamente — o frontend chama `/api/auth/refresh` quando recebe 401, e o usuário nem percebe.

### `account_recovery_setting` — só email, sem SMS

Consistente com a decisão de não usar SMS. Recuperação de conta é por link de email, sem custo e sem vulnerabilidade a SIM Swap.

---

## 3. Por que cada componente do backend?

### `CognitoClientConfig.java`

Cria o `CognitoIdentityProviderClient` como bean Spring. Centraliza a configuração da região AWS. Na EC2, o SDK usa o **IAM Instance Profile** automaticamente (sem credenciais hardcoded). Em dev local, usa `~/.aws/credentials` (o compose monta o diretório como volume read-only).

### `CognitoJwtDecoderConfig.java` — por que condicional?

```java
@ConditionalOnProperty(name = "security.auth.disabled", havingValue = "false", matchIfMissing = true)
```

O Spring Boot, ao ver `spring.security.oauth2.resourceserver.jwt.issuer-uri`, tenta buscar o JWKS da AWS **na inicialização**. Em dev com auth desabilitada, não há Cognito configurado — o app não subiria.

A solução: remover a propriedade do `application.properties` e criar o `JwtDecoder` manualmente com `@ConditionalOnProperty`. O decoder só é criado (e o JWKS buscado) quando `SECURITY_AUTH_DISABLED=false`. Em dev, o bean não existe e o código que o usa nunca é executado.

### Por que validar `client_id` e não `aud`?

O JWT do Cognito tem dois tipos de token:
- **access token**: tem o claim `client_id` (mas NÃO tem `aud`)
- **id token**: tem o claim `aud` (mas NÃO tem `client_id`)

Usamos o **access token** para autenticar requests na API (é o padrão OAuth2). Se validássemos `aud`, o validator rejeitaria todos os access tokens porque eles não têm esse campo. A validação correta para access tokens do Cognito é verificar o claim `client_id`.

Isso também impede que um id token seja usado no lugar de um access token — o id token não tem `client_id`, então falha na validação.

### `CookieBearerTokenResolver.java`

Por padrão, o Spring Security lê o JWT do header `Authorization: Bearer <token>`. Mas o token está no cookie, não no header. Esse resolver diz ao Spring onde encontrá-lo: lê o cookie `access_token` e retorna o valor para o pipeline de validação JWT.

### `CognitoUserSyncFilter.java` — por que um filtro separado?

O Cognito gerencia autenticação — quem é o usuário. O banco local gerencia autorização — a quais projetos esse usuário pertence, qual seu role.

O filtro roda depois da validação JWT, extrai o `sub` (identificador único do Cognito), e faz **upsert** no banco: se o usuário já existe, retorna; se não, busca atributos no Cognito e cria.

**Por que `AdminGetUser` apenas no primeiro login?**

O access token tem `sub` e `username`, mas não tem `email`, `given_name`, `family_name`. Esses campos ficam no id token. Em vez de usar o id token (que é para identificação do cliente, não autorização de API), chamamos `AdminGetUser` no Cognito quando precisamos criar o usuário local — apenas uma vez, na primeira autenticação. Nas próximas, o usuário já existe no banco e a chamada AWS é evitada.

### `AuthenticatedUser.java` — por que `@RequestScope`?

Sem isso, cada serviço que precisasse do usuário atual faria uma query ao banco. Num request que verifica permissão em 3 projetos diferentes, isso seriam queries desnecessárias.

Com `@RequestScope`, o bean existe uma vez por request. O filtro carrega o usuário do banco e o armazena. Qualquer serviço que precise do usuário só injeta `AuthenticatedUser` — zero queries adicionais.

```java
// No filtro — uma query por request
authenticatedUser.set(userService.findOrCreate(...));

// Em qualquer serviço — zero queries adicionais
User currentUser = authenticatedUser.get();
```

### `CognitoAuthService.java` — por que SECRET_HASH em toda chamada?

Quando o App Client tem `client_secret`, o Cognito exige que toda chamada inclua:

```
SECRET_HASH = Base64(HMAC-SHA256(key=clientSecret, msg=username+clientId))
```

Sem ele, o Cognito retorna `NotAuthorizedException` mesmo com credenciais corretas. É uma prova de que quem chama conhece o secret — um browser não conseguiria computar isso sem expor o secret ao usuário.

### `AuthController.java` — por que 401 genérico para todos os erros?

```java
return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas"));
```

O Cognito diferencia erros: `UserNotFoundException`, `NotAuthorizedException`, `CodeMismatchException`. Se expuséssemos esses detalhes, um atacante saberia se um email existe no sistema. Com 401 genérico para qualquer erro de auth, não há como enumerar contas.

---

## 4. Por que cada decisão de segurança?

### Cookies com `SameSite=Strict`

`SameSite=Strict` instrui o browser a nunca enviar o cookie em requisições originadas de outros sites. Se o usuário está em `evil.com` e essa página tenta fazer um POST para a API, o browser não inclui o cookie. Elimina CSRF na raiz.

### Por que `ResponseCookie` em vez de `jakarta.servlet.http.Cookie`?

A API `Cookie` do Jakarta Servlet não tem método `setSameSite()`. A única forma de definir `SameSite=Strict` é usar `ResponseCookie` do Spring e injetar via `addHeader("Set-Cookie", cookie.toString())`, que serializa o header completo incluindo o atributo SameSite.

### Por que os endpoints de auth são isentos de CSRF token?

Os endpoints `/api/auth/**` são isentos de CSRF token porque têm proteções equivalentes:
1. **Login**: não há cookies de sessão ainda — CSRF não se aplica.
2. **MFA**: o `session` do Cognito é um token opaco obtido apenas após completar o passo anterior na mesma origem. Funciona como CSRF token natural — impossível forjá-lo.
3. **Refresh/Logout**: protegidos por `SameSite=Strict` — requisição cross-site não inclui os cookies.

### Cookies com `Path` restrito

```
access_token  → Path=/api              (enviado em todas as chamadas de API)
refresh_token → Path=/api/auth/refresh (enviado APENAS ao endpoint de refresh)
```

O `refresh_token` não vaza para chamadas de API normais. Em cada request autenticado, o browser envia o `access_token`, mas não o `refresh_token`. O token mais poderoso (que gera novos tokens e tem validade de 30 dias) só é exposto ao único endpoint que precisa dele.

### `GlobalSignOut` no logout — por que não só apagar o cookie?

Apagar o cookie local desconecta o usuário do browser atual, mas o token continua válido no Cognito até expirar (1h para access token, 30d para refresh token). Se o token foi comprometido antes do logout, o atacante ainda tem acesso pelo tempo restante.

`GlobalSignOut` invalida a sessão no Cognito imediatamente — todos os tokens do usuário se tornam inválidos, em todos os dispositivos. Logout verdadeiro.

### `/api/auth/logout` não está no `permitAll`

Logout exige autenticação por design. O `access_token` válido é necessário para chamar `GlobalSignOut` no Cognito — a API exige o access token para identificar qual sessão invalidar.

### `SessionCreationPolicy.STATELESS`

O Spring Security não cria `HttpSession`. Cada request é autenticado pelo JWT do cookie, sem estado no servidor. Escala horizontalmente sem sessões compartilhadas, elimina session fixation, e remove o `JSESSIONID` (que aparece apenas em dev com auth desabilitada, onde essa política não é aplicada).

### Headers de segurança

```java
.frameOptions(frame -> frame.deny())                    // X-Frame-Options: DENY
.contentSecurityPolicy("default-src 'self'; ...")       // CSP
```

- **X-Frame-Options: DENY**: impede que o app seja embutido em um `<iframe>` de outro site (clickjacking — o usuário clica achando que está no app, mas está numa sobreposição do site do atacante).
- **CSP**: restringe de onde scripts podem ser carregados — mitiga XSS limitando scripts a `'self'`.

### Swagger desabilitado em produção

```java
.requestMatchers("/swagger-ui/**", "/api-docs/**").denyAll()
```

Documentação de API exposta em produção vira um mapa para atacantes: lista todos os endpoints, parâmetros esperados, estruturas de dados. `denyAll()` retorna 403.

---

## 5. Fluxos de autenticação

### Primeiro acesso (admin criou o usuário)

```
1. POST /api/auth/login
   Body: { email, password (temporária) }
   → 200 { status: "NEW_PASSWORD_REQUIRED", session: "..." }

2. POST /api/auth/new-password
   Body: { session, email, newPassword }
   → 200 { status: "MFA_SETUP_REQUIRED", session: "..." }

3. POST /api/auth/mfa-setup
   Body: { session, email }
   → 200 { session: "...", otpauthUri: "otpauth://totp/..." }
   → usuário abre Google Authenticator → escaneia QR gerado a partir do otpauthUri

4. POST /api/auth/mfa-setup/complete
   Body: { session, email, code (6 dígitos do app) }
   → 200
   → Set-Cookie: access_token (Path=/api, HttpOnly, Secure, SameSite=Strict, Max-Age=3600)
   → Set-Cookie: refresh_token (Path=/api/auth/refresh, HttpOnly, Secure, SameSite=Strict, Max-Age=2592000)
```

### Logins subsequentes

```
1. POST /api/auth/login
   Body: { email, password }
   → 200 { status: "MFA_REQUIRED", session: "..." }

2. POST /api/auth/mfa-verify
   Body: { session, email, code }
   → 200 + cookies
```

### Token expirado (transparente ao usuário)

```
1. Frontend chama GET /api/users/me
   → 401 (access_token expirou após 1h)

2. Frontend chama POST /api/auth/refresh?email=...
   → 200 + novo access_token no cookie

3. Frontend repete GET /api/users/me
   → 200 com dados do usuário
```

### Logout

```
1. POST /api/auth/logout (com access_token no cookie)
   → Backend chama Cognito GlobalSignOut (invalida todos os tokens do usuário)
   → Set-Cookie: access_token="" Max-Age=0
   → Set-Cookie: refresh_token="" Max-Age=0
   → 200
```

### Sincronização de usuário local (primeiro acesso ao /api após login)

```
1. Request chega com access_token cookie
2. CookieBearerTokenResolver extrai o JWT do cookie
3. Spring Security valida: assinatura, issuer, client_id, expiração
4. CognitoUserSyncFilter executa:
   a. Extrai sub do JWT
   b. Busca usuário no banco por cognito_sub
   c. Se não existe: chama AdminGetUser no Cognito para pegar email/nome → cria usuário
   d. Armazena User em AuthenticatedUser (@RequestScope)
5. Controller/Services acessam AuthenticatedUser.get() sem queries adicionais
```

---

## 6. Variáveis de ambiente

| Variável | Obrigatória em prod | Default em dev | Descrição |
|---|:---:|:---:|---|
| `COGNITO_REGION` | Sim | `us-east-2` | Região AWS do User Pool |
| `COGNITO_USER_POOL_ID` | Sim | `placeholder` | ID do User Pool (ex: `us-east-2_XXXXXXX`) |
| `COGNITO_CLIENT_ID` | Sim | `placeholder` | ID do App Client |
| `COGNITO_CLIENT_SECRET` | Sim | `placeholder` | Secret do App Client — nunca commitar |
| `SECURITY_AUTH_DISABLED` | Não | `true` | `false` em produção, `true` em dev local |
| `AUTH_COOKIE_SECURE` | Não | `false` em dev | `true` exige HTTPS — obrigatório em produção |
| `AUTH_COOKIE_DOMAIN` | Não | vazio | Domínio do cookie em produção |
| `CORS_ALLOWED_ORIGINS` | Sim em prod | `*` | Domínio do frontend — nunca `*` em produção |
| `AWS_PROFILE` | Não | `wsssguardo` | Profile AWS para dev local (não usado na EC2) |

---

## 7. Próximos passos — Frontend

O frontend não usa SDK do Cognito nem manipula tokens diretamente. Chama os endpoints do backend; o backend gerencia toda a complexidade de tokens.

### 7.1 — `src/api/http.ts` — wrapper de fetch

Toda chamada de API passa por aqui. Responsabilidades:
- Adicionar header `X-XSRF-TOKEN` (CSRF token para endpoints autenticados)
- Detectar 401 e tentar refresh automático silencioso (uma vez)
- Redirecionar para `/login` se o refresh falhar

**Por que o CSRF token aqui?** O Spring envia um cookie `XSRF-TOKEN` legível pelo JS (não-httpOnly). O frontend lê esse cookie e o injeta como header `X-XSRF-TOKEN`. O backend valida que o valor do header bate com o cookie — uma página de outro site não consegue ler o cookie e forjar o header.

**Por que o email no refresh?** O Cognito exige `SECRET_HASH` em toda chamada, e o hash inclui o email. O backend precisa do email para computá-lo. O email não é sensível — pode ficar em `localStorage` (diferente dos tokens).

### 7.2 — `src/contexts/AuthContext.tsx`

Estado global de autenticação. Ao montar, chama `GET /api/users/me` para verificar sessão ativa (cookie válido = usuário autenticado).

```ts
interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  setNewPassword: (session: string, email: string, newPassword: string) => Promise<LoginResponse>;
  startMfaSetup: (session: string, email: string) => Promise<MfaSetupResponse>;
  completeMfaSetup: (session: string, email: string, code: string) => Promise<void>;
  verifyMfa: (session: string, email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 7.3 — `src/pages/Login.tsx` — máquina de estados

A página gerencia os estágios do fluxo Cognito:

```
CREDENTIALS
    ↓ NEW_PASSWORD_REQUIRED
NEW_PASSWORD
    ↓ MFA_SETUP_REQUIRED
MFA_SETUP  →  usuário escaneia QR  →  MFA_SETUP_CONFIRM
    ↓ MFA_REQUIRED (logins normais)
MFA_VERIFY
    ↓ SUCCESS
redirect para /
```

O `session` do Cognito é mantido em estado local da página — não vai para Context nem para localStorage.

### 7.4 — `src/components/ProtectedRoute.tsx`

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

### 7.5 — Atualizar `src/api/*.ts`

Substituir `fetch(` por `apiFetch(` e garantir `credentials: "include"` em:
`company.ts`, `artifact.ts`, `asset.ts`, `finding.ts`, `note.ts`, `risk.ts`, `projectConfiguration.ts`, `entityObject.ts`

### 7.6 — `GlobalHeader.tsx`

Substituir "Daniel Moura / Consultor" pelos dados do `useAuth().user`:

```tsx
const { user, logout } = useAuth();
// ...
<span>{user?.firstName} {user?.lastName}</span>
<span>{user?.role}</span>
<button onClick={logout}>Sair</button>
```

### 7.7 — `main.tsx`

```tsx
<AuthProvider>
  <Router>
    <Route path="/login" element={<Login />} />
    <Route path="/*" element={
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    } />
  </Router>
</AuthProvider>
```

---

## Resumo de vetores de segurança cobertos

| Vetor de ataque | Proteção implementada |
|---|---|
| XSS rouba token | `httpOnly` — JS nunca acessa o token |
| XSS executa requests autenticados | CSP bloqueia scripts não autorizados |
| Clickjacking | `X-Frame-Options: DENY` |
| CSRF em endpoints autenticados | `SameSite=Strict` + `XSRF-TOKEN` header |
| CSRF em endpoints de auth | `SameSite=Strict` + session Cognito como token natural |
| Brute force de senha | Cognito nativo (lockout automático após N falhas) |
| Credential stuffing | MFA obrigatório — senha vazada de outro site não basta |
| SIM Swap bypassa MFA | TOTP local, sem SMS |
| Token de outro app aceito | `client_id` validado no JWT decoder |
| Token expirado aceito | `exp` validado pelo Spring Security |
| ID token usado como access token | `client_id` claim só existe no access token |
| Logout parcial (token ainda válido) | `GlobalSignOut` invalida sessão no Cognito |
| Refresh token exposto em outros endpoints | `Path=/api/auth/refresh` — cookie não é enviado em outras chamadas |
| Client secret exposto no browser | Apenas no backend (env var), nunca enviado ao cliente |
| Account enumeration | `prevent_user_existence_errors` no Cognito + 401 genérico no backend |
| Auto-registro não autorizado | `allow_admin_create_user_only = true` |
| Swagger exposto em produção | `denyAll()` para `/swagger-ui/**` e `/api-docs/**` |
| CORS aberto | `CORS_ALLOWED_ORIGINS` configurável; deve ser restrito em produção |
