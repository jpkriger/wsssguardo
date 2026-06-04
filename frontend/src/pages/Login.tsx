import { type ReactElement, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm/LoginForm";
import NewPasswordForm from "@/components/NewPasswordForm/NewPasswordForm";
import MFAForm from "@/components/MFAForm/MFAForm";
import MFAVerificationForm from "@/components/MFAVerificationForm/MFAVerificationForm";

type Stage = "CREDENTIALS" | "NEW_PASSWORD" | "MFA_SETUP" | "MFA_VERIFY";

function messageOf(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function extractSecret(otpauthUri: string): string {
  try {
    return new URL(otpauthUri).searchParams.get("secret") ?? "";
  } catch {
    return /[?&]secret=([^&]+)/.exec(otpauthUri)?.[1] ?? "";
  }
}

export default function Login(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("CREDENTIALS");
  const [session, setSession] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth.user) {
    return <Navigate to="/" replace />;
  }

  function reset(): void {
    setStage("CREDENTIALS");
    setSession(null);
    setSecret("");
    setError(null);
    setLoading(false);
  }

  async function beginMfaSetup(setupSession: string, userEmail: string): Promise<void> {
    const setup = await auth.startMfaSetup(setupSession, userEmail);
    setSession(setup.session);
    setSecret(extractSecret(setup.otpauthUri));
    setStage("MFA_SETUP");
  }

  async function handleLogin(formEmail: string, password: string): Promise<void> {
    setLoading(true);
    setError(null);
    setEmail(formEmail);
    try {
      const result = await auth.login(formEmail, password);
      switch (result.status) {
        case "SUCCESS":
          void navigate("/", { replace: true });
          break;
        case "MFA_REQUIRED":
          setSession(result.session);
          setStage("MFA_VERIFY");
          break;
        case "NEW_PASSWORD_REQUIRED":
          setSession(result.session);
          setStage("NEW_PASSWORD");
          break;
        case "MFA_SETUP_REQUIRED":
          await beginMfaSetup(result.session ?? "", formEmail);
          break;
      }
    } catch (e) {
      setError(messageOf(e, "Não foi possível entrar. Verifique suas credenciais."));
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(newPassword: string): Promise<void> {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await auth.setNewPassword(session, email, newPassword);
      if (result.status === "SUCCESS") {
        void navigate("/", { replace: true });
      } else {
        await beginMfaSetup(result.session ?? session, email);
      }
    } catch (e) {
      setError(messageOf(e, "Não foi possível definir a nova senha."));
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSetup(code: string): Promise<void> {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      await auth.completeMfaSetup(session, email, code);
      void navigate("/", { replace: true });
    } catch (e) {
      setError(messageOf(e, "Código inválido. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaVerify(code: string): Promise<void> {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      await auth.verifyMfa(session, email, code);
      void navigate("/", { replace: true });
    } catch (e) {
      setError(messageOf(e, "Código inválido. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center w-full p-4">
      {stage === "CREDENTIALS" && (
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      )}
      {stage === "NEW_PASSWORD" && (
        <NewPasswordForm
          onSubmit={handleNewPassword}
          loading={loading}
          error={error}
          onBack={reset}
        />
      )}
      {stage === "MFA_SETUP" && (
        <MFAVerificationForm
          email={email}
          secret={secret}
          onSubmit={handleMfaSetup}
          loading={loading}
          error={error}
          onBack={reset}
        />
      )}
      {stage === "MFA_VERIFY" && (
        <MFAForm onSubmit={handleMfaVerify} loading={loading} error={error} onBack={reset} />
      )}
    </div>
  );
}
