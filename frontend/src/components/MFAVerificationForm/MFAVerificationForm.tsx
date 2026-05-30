import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { ReactElement, useRef, useState } from "react";
import QRCode from "react-qr-code";

interface MFAVerificationFormProps {
  email: string;
  secret: string;
}

export default function MFAVerificationForm({
  email,
  secret,
}: MFAVerificationFormProps): ReactElement {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array<HTMLInputElement | null>(6).fill(null));

  const totpUri = `otpauth://totp/WSSSguardo:${encodeURIComponent(email)}?secret=${secret}&issuer=WSSSguardo`;

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
        <h2 className="text-2xl font-normal text-foreground leading-tight">
          Configurar Autenticador
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o QR code com seu aplicativo autenticador
        </p>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <div className="grid gap-5">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg">
              <QRCode value={totpUri} size={160} />
            </div>
          </div>

          {/* Chave manual */}
          <div className="grid gap-1">
            <p className="text-xs text-muted-foreground text-center">
              Ou insira a chave manualmente
            </p>
            <div className="flex items-center gap-2 rounded-md border border-input bg-input/30 px-3 py-2">
              <span className="flex-1 font-mono text-xs text-foreground tracking-widest truncate select-all">
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
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-10 h-12 text-center text-lg rounded-md border border-input bg-input/30 text-foreground transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            ))}
          </div>

          <Button type="button" className="w-full">
            Verificar
          </Button>

          <div className="flex justify-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao login
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
