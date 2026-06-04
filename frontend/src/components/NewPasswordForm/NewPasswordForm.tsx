import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { type FormEvent, type ReactElement, useState } from "react";

interface NewPasswordFormProps {
  onSubmit: (newPassword: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

const MIN_LENGTH = 12;

interface Rule {
  label: string;
  test: (pwd: string) => boolean;
}

// Espelha a policy do Cognito (doc seção 2): mín. 12 + maiúscula + minúscula + número + símbolo.
const RULES: Rule[] = [
  { label: `Mínimo de ${MIN_LENGTH} caracteres`, test: (p) => p.length >= MIN_LENGTH },
  { label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Um número", test: (p) => /[0-9]/.test(p) },
  { label: "Um símbolo", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function NewPasswordForm({
  onSubmit,
  loading = false,
  error,
  onBack,
}: NewPasswordFormProps): ReactElement {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const meetsAllRules = RULES.every((rule) => rule.test(password));
  const passwordsMatch = password === confirm;
  const canSubmit = meetsAllRules && passwordsMatch && !loading;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (loading) return;
    if (!meetsAllRules) {
      setLocalError("A senha não atende a todos os requisitos.");
      return;
    }
    if (!passwordsMatch) {
      setLocalError("As senhas não coincidem.");
      return;
    }
    setLocalError(null);
    void onSubmit(password);
  }

  return (
    <Card className="w-full max-w-sm py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-5">
        <h2 className="text-2xl font-normal text-foreground leading-tight">Definir nova senha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie uma senha forte para acessar a plataforma.
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <ul className="grid gap-1">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {ok ? <Check size={13} /> : <X size={13} className="opacity-50" />}
                  {rule.label}
                </li>
              );
            })}
          </ul>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
            {confirm !== "" && !passwordsMatch && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          {(localError ?? error) && (
            <p className="text-sm text-destructive">{localError ?? error}</p>
          )}

          <Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Continuar
          </Button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao login
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
