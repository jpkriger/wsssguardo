import { type ReactElement, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Archive, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiErrorResponse } from "@/lib/api-client";
import {
  confirmArchive,
  downloadProjectArchive,
  sha256Hex,
} from "@/api/archive";

type Step = "idle" | "warning" | "downloading" | "verify" | "confirming";

interface Props {
  projectId: string;
  disabled?: boolean;
}

export default function ArchiveProjectButton({
  projectId,
  disabled,
}: Props): ReactElement {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadedFileName, setDownloadedFileName] = useState("");
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset(): void {
    setStep("idle");
    setError(null);
    setVerifiedHash(null);
    setDownloadedFileName("");
  }

  function handleClose(): void {
    if (step === "downloading" || step === "confirming") return;
    reset();
  }

  async function handleStartArchive(): Promise<void> {
    setStep("downloading");
    setError(null);
    try {
      const { blob, fileName } = await downloadProjectArchive(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadedFileName(fileName);
      setStep("verify");
    } catch (err) {
      const msg =
        err instanceof ApiErrorResponse
          ? err.getUserMessage()
          : "Erro ao gerar o arquivo de backup.";
      setError(msg);
      setStep("warning");
    }
  }

  async function handleFileSelected(file: File): Promise<void> {
    setError(null);
    const hash = await sha256Hex(file);
    setVerifiedHash(hash);
  }

  async function handleConfirm(): Promise<void> {
    if (!verifiedHash) return;
    setStep("confirming");
    setError(null);
    try {
      await confirmArchive(projectId, verifiedHash);
      void navigate("/projects");
    } catch (err) {
      const is400 =
        err instanceof ApiErrorResponse && err.status === 400;
      setError(
        is400
          ? "O arquivo não confere com o backup gerado. Verifique se está usando o arquivo correto."
          : "Erro ao confirmar o backup. Tente novamente.",
      );
      setVerifiedHash(null);
      setStep("verify");
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(): void {
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFileSelected(file);
  }

  const warningOpen = step === "warning" || step === "downloading";
  const verifyOpen = step === "verify" || step === "confirming";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setStep("warning")}
      >
        <Archive className="size-4" />
        Arquivar projeto
      </Button>

      {/* Passo 1: aviso antes de gerar o backup */}
      <Dialog
        open={warningOpen}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent showCloseButton={step !== "downloading"}>
          <DialogHeader>
            <DialogTitle>Arquivar projeto?</DialogTitle>
            <DialogDescription>
              Isso irá gerar um arquivo de backup criptografado{" "}
              <strong>(.p7m)</strong> e baixá-lo para o seu computador.
              <br />
              <br />
              Após baixar, você precisará confirmar que guardou o arquivo em
              local seguro. Só então o projeto será apagado do sistema.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={step === "downloading"}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleStartArchive()}
              disabled={step === "downloading"}
            >
              {step === "downloading" ? "Gerando backup..." : "Gerar backup e baixar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passo 2: confirmar que o backup foi guardado */}
      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent
          className="sm:max-w-lg"
          showCloseButton={step !== "confirming"}
        >
          <DialogHeader>
            <DialogTitle>Confirmar backup</DialogTitle>
            <DialogDescription>
              O arquivo <strong>{downloadedFileName}</strong> foi baixado.
              Guarde-o em local seguro (HD externo, servidor offline, etc).
              <br />
              <br />
              Quando estiver guardado, arraste o arquivo abaixo para confirmar
              que ele está íntegro:
            </DialogDescription>
          </DialogHeader>

          {/* Drop zone */}
          <div
            className={[
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer select-none",
              isDragging
                ? "border-primary bg-primary/5"
                : verifiedHash
                  ? "border-green-500 bg-green-500/5"
                  : "border-border hover:border-muted-foreground/50",
            ].join(" ")}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".p7m"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
                e.target.value = "";
              }}
            />

            {verifiedHash ? (
              <>
                <CheckCircle className="size-8 text-green-500" />
                <div className="text-center">
                  <p className="text-sm font-medium text-green-600">
                    Arquivo verificado
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                    {verifiedHash}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Arraste o arquivo .p7m aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou clique para selecionar
                  </p>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={step === "confirming"}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirm()}
              disabled={!verifiedHash || step === "confirming"}
            >
              {step === "confirming"
                ? "Confirmando..."
                : "Confirmar e apagar projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
