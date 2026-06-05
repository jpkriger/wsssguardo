import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import type { LoginResponse, MfaSetupResponse, UserProfile } from "@/api/auth";
import { AUTH_EMAIL_KEY, AUTH_LOGOUT_EVENT } from "@/lib/api-client";
import { AuthContext } from "./AuthContext";

const FAKE_USER: UserProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  firstName: "Dev",
  lastName: "User",
  email: "dev@wsssguardo.local",
  role: "MANAGER",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<UserProfile | null>(AUTH_DISABLED ? FAKE_USER : null);
  const [isLoading, setIsLoading] = useState(!AUTH_DISABLED);

  const loadUser = useCallback(async (): Promise<void> => {
    try {
      setUser(await authApi.getMe());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    void loadUser().finally(() => setIsLoading(false));
  }, [loadUser]);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    const onLogout = (): void => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      if (AUTH_DISABLED) {
        setUser(FAKE_USER);
        return { status: "SUCCESS", session: null };
      }
      localStorage.setItem(AUTH_EMAIL_KEY, email);
      const result = await authApi.login(email, password);
      if (result.status === "SUCCESS") await loadUser();
      return result;
    },
    [loadUser],
  );

  const setNewPassword = useCallback(
    async (session: string, email: string, newPassword: string): Promise<LoginResponse> => {
      if (AUTH_DISABLED) return { status: "SUCCESS", session: null };
      const result = await authApi.setNewPassword(session, email, newPassword);
      if (result.status === "SUCCESS") await loadUser();
      return result;
    },
    [loadUser],
  );

  const startMfaSetup = useCallback(
    (session: string, email: string): Promise<MfaSetupResponse> =>
      AUTH_DISABLED
        ? Promise.resolve({ session, otpauthUri: "otpauth://totp/wsssguardo:dev?secret=DEV" })
        : authApi.startMfaSetup(session, email),
    [],
  );

  const completeMfaSetup = useCallback(
    async (session: string, email: string, code: string): Promise<void> => {
      if (AUTH_DISABLED) return;
      await authApi.completeMfaSetup(session, email, code);
      await loadUser();
    },
    [loadUser],
  );

  const verifyMfa = useCallback(
    async (session: string, email: string, code: string): Promise<void> => {
      if (AUTH_DISABLED) return;
      await authApi.verifyMfa(session, email, code);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    if (AUTH_DISABLED) return;
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
