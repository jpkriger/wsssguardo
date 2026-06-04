import apiClient from "@/lib/api-client";

export type LoginStatus =
  | "SUCCESS"
  | "MFA_REQUIRED"
  | "MFA_SETUP_REQUIRED"
  | "NEW_PASSWORD_REQUIRED";

export interface LoginResponse {
  status: LoginStatus;
  session: string | null;
}

export interface MfaSetupResponse {
  session: string;
  otpauthUri: string;
}

export type UserRole = "CONSULTANT" | "MANAGER";

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Etapa 1: credenciais. Em caso de SUCCESS o backend já seta os cookies. */
export function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient.post("auth/login", { json: { email, password } }).json<LoginResponse>();
}

/** Primeiro acesso: troca a senha temporária. */
export function setNewPassword(
  session: string,
  email: string,
  newPassword: string,
): Promise<LoginResponse> {
  return apiClient
    .post("auth/new-password", { json: { session, email, newPassword } })
    .json<LoginResponse>();
}

/** Inicia o cadastro de MFA (TOTP) e retorna o otpauth:// para o QR Code. */
export function startMfaSetup(session: string, email: string): Promise<MfaSetupResponse> {
  return apiClient
    .post("auth/mfa-setup", { json: { session, email } })
    .json<MfaSetupResponse>();
}

/** Conclui o cadastro de MFA com o código do app. Em sucesso, o backend seta os cookies. */
export async function completeMfaSetup(
  session: string,
  email: string,
  code: string,
): Promise<void> {
  await apiClient.post("auth/mfa-setup/complete", { json: { session, email, code } });
}

/** Logins subsequentes: confirma o código TOTP. Em sucesso, o backend seta os cookies. */
export async function verifyMfa(session: string, email: string, code: string): Promise<void> {
  await apiClient.post("auth/mfa-verify", { json: { session, email, code } });
}

/** Encerra a sessão (GlobalSignOut no Cognito) e limpa os cookies. */
export async function logout(): Promise<void> {
  await apiClient.post("auth/logout");
}

/** Retorna o usuário autenticado a partir do cookie de sessão. */
export function getMe(): Promise<UserProfile> {
  return apiClient.get("users/me").json<UserProfile>();
}
