import { createContext, useContext } from "react";
import type { LoginResponse, MfaSetupResponse, UserProfile } from "@/api/auth";

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  setNewPassword: (session: string, email: string, newPassword: string) => Promise<LoginResponse>;
  startMfaSetup: (session: string, email: string) => Promise<MfaSetupResponse>;
  completeMfaSetup: (session: string, email: string, code: string) => Promise<void>;
  verifyMfa: (session: string, email: string, code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}
