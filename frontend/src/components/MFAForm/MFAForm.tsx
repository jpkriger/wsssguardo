import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type ReactElement, useRef, useState } from "react";

interface MFAFormProps {
  onSubmit: (code: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

export default function MFAForm({ onSubmit, loading = false, error, onBack }: MFAFormProps): ReactElement {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array<HTMLInputElement | null>(6).fill(null));

  const code = otp.join("");
  const canSubmit = code.length === 6 && !loading;

  function submit(): void {
    if (code.length === 6 && !loading) void onSubmit(code);
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      submit();
      return;
    }
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <Card className="w-full max-w-xs py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-5">
        <h2 className="text-2xl font-normal text-foreground leading-tight">
          Autenticação de Dois Fatores
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <div className="grid gap-5">
          <div className="flex gap-2 justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={otp[i]}
                disabled={loading}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-10 h-12 text-center text-lg rounded-md border border-input bg-input/30 text-foreground transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="button" className="w-full" onClick={submit} disabled={!canSubmit}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verificar
          </Button>

          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao login
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
