import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type FormEvent, type ReactElement, useState } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function LoginForm({ onSubmit, loading = false, error }: LoginFormProps): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (loading) return;
    void onSubmit(email, password);
  }

  const canSubmit = email.trim() !== "" && password !== "" && !loading;

  return (
    <Card className="w-full max-w-xs py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-5">
        <h2 className="text-2xl font-normal text-foreground leading-tight">Login</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acesse sua conta na plataforma WSS Sguardo
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
