import apiClient from "@/lib/api-client";

export interface MfaStatus {
  enabled: boolean;
}

export interface MfaDeviceSetup {
  otpauthUri: string;
}

/** Altera a senha do usuário logado (valida a senha atual no Cognito). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post("account/password", { json: { currentPassword, newPassword } });
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}

/** Atualiza nome e/ou e-mail do usuário logado (só o que mudou) e sincroniza no backend. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await apiClient.patch("account/profile", { json: payload });
}

/** Indica se o usuário já tem um dispositivo TOTP ativo. */
export function getMfaStatus(): Promise<MfaStatus> {
  return apiClient.get("account/mfa").json<MfaStatus>();
}

/** Inicia o cadastro de um novo dispositivo TOTP e retorna o otpauth:// para o QR Code. */
export function startMfaDeviceSetup(): Promise<MfaDeviceSetup> {
  return apiClient.post("account/mfa/setup").json<MfaDeviceSetup>();
}

/** Confirma o código do app autenticador e ativa o novo dispositivo. */
export async function verifyMfaDevice(code: string): Promise<void> {
  await apiClient.post("account/mfa/verify", { json: { code } });
}
