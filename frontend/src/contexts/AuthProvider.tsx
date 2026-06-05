import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import type { LoginResponse, MfaSetupResponse, UserProfile } from "@/api/auth";
import { AUTH_EMAIL_KEY, AUTH_LOGOUT_EVENT } from "@/lib/api-client";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<void> => {
    try {
      setUser(await authApi.getMe());
    } catch {
      setUser(null);
    }
  }, []);

  // Verifica sessão ativa ao montar (cookie httpOnly válido => usuário autenticado).
  useEffect(() => {
    void loadUser().finally(() => setIsLoading(false));
  }, [loadUser]);

  // Refresh falhou em alguma chamada => sessão expirou: limpa o usuário.
  useEffect(() => {
    const onLogout = (): void => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      // Persiste o email para o backend recompor o SECRET_HASH no refresh.
      localStorage.setItem(AUTH_EMAIL_KEY, email);
      const result = await authApi.login(email, password);
      if (result.status === "SUCCESS") await loadUser();
      return result;
    },
    [loadUser],
  );

  const setNewPassword = useCallback(
    async (session: string, email: string, newPassword: string): Promise<LoginResponse> => {
      const result = await authApi.setNewPassword(session, email, newPassword);
      if (result.status === "SUCCESS") await loadUser();
      return result;
    },
    [loadUser],
  );

  const startMfaSetup = useCallback(
    (session: string, email: string): Promise<MfaSetupResponse> =>
      authApi.startMfaSetup(session, email),
    [],
  );

  const completeMfaSetup = useCallback(
    async (session: string, email: string, code: string): Promise<void> => {
      await authApi.completeMfaSetup(session, email, code);
      await loadUser();
    },
    [loadUser],
  );

  const verifyMfa = useCallback(
    async (session: string, email: string, code: string): Promise<void> => {
      await authApi.verifyMfa(session, email, code);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(AUTH_EMAIL_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        setNewPassword,
        startMfaSetup,
        completeMfaSetup,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
