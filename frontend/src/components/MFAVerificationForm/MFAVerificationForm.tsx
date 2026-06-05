import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import { type ReactElement, useRef, useState } from "react";
import QRCode from "react-qr-code";

interface MFAVerificationFormProps {
  email: string;
  secret: string;
  onSubmit: (code: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

export default function MFAVerificationForm({
  email,
  secret,
  onSubmit,
  loading = false,
  error,
  onBack,
}: MFAVerificationFormProps): ReactElement {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array<HTMLInputElement | null>(6).fill(null));

  const totpUri = `otpauth://totp/WSSSguardo:${encodeURIComponent(email)}?secret=${secret}&issuer=WSSSguardo`;
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

  function handleCopy() {
    void navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="w-full max-w-sm py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-5">
        <h2 className="text-2xl font-normal text-foreground leading-tight">Configurar Autenticador</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o QR code com seu aplicativo autenticador
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <div className="grid min-w-0 gap-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg">
              <QRCode value={totpUri} size={140} />
            </div>
          </div>

          {/* Chave manual */}
          <div className="grid min-w-0 gap-1">
            <p className="text-xs text-muted-foreground text-center">
              Ou insira a chave manualmente
            </p>
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-input/30 px-3 py-2">
              <span className="min-w-0 flex-1 font-mono text-xs text-foreground tracking-widest truncate select-all">
                {secret}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors outline-none shrink-0"
                aria-label="Copiar chave"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">confirme o código</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* OTP inputs */}
          <div className="grid grid-cols-6 gap-2">
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
                className="h-12 w-full min-w-0 text-center text-lg rounded-md border border-input bg-input/30 text-foreground transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="button" className="w-full" onClick={submit} disabled={!canSubmit}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verificar
          </Button>

          <div className="flex justify-center">
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
