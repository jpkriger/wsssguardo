import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type FormEvent, type ReactElement, useState } from "react";

interface NewPasswordFormProps {
  onSubmit: (newPassword: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

const MIN_LENGTH = 12;

export default function NewPasswordForm({
  onSubmit,
  loading = false,
  error,
  onBack,
}: NewPasswordFormProps): ReactElement {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (loading) return;
    if (password.length < MIN_LENGTH) {
      setLocalError(`A senha deve ter no mínimo ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setLocalError("As senhas não coincidem.");
      return;
    }
    setLocalError(null);
    void onSubmit(password);
  }

  return (
    <Card className="w-full max-w-xs py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-5">
        <h2 className="text-2xl font-normal text-foreground leading-tight">Definir nova senha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie uma senha com no mínimo {MIN_LENGTH} caracteres, incluindo maiúscula, minúscula,
          número e símbolo.
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
          </div>

          {(localError ?? error) && (
            <p className="text-sm text-destructive">{localError ?? error}</p>
          )}

          <Button type="submit" className="w-full mt-1" disabled={loading}>
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
