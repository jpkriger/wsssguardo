import { useState, useEffect, useRef, type ReactElement } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ArtifactContentType, ArtifactResponse } from "../../api/artifact";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const TIPO_OPTIONS: { value: ArtifactContentType; label: string }[] = [
  { value: "document", label: "Documento" },
  { value: "image", label: "Imagem" },
  { value: "sheet", label: "Planilha" },
];

function isGoogleDriveLink(url: string): boolean {
  return (
    url.startsWith("https://drive.google.com/") ||
    url.startsWith("https://docs.google.com/")
  );
}

function fileLabelFor(contentType: ArtifactContentType): string {
  if (contentType === "image") return "IMG";
  if (contentType === "sheet") return "PLANILHA";
  return "DOC";
}

interface NewArtifactComposerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaveArtifact?: (
    artifact: Omit<
      ArtifactResponse,
      | "id"
      | "createdAt"
      | "lastEditedAt"
      | "lastEditedBy"
      | "author"
      | "findings"
    >,
  ) => void;
}

export default function NewArtifactComposer({
  open: controlledOpen,
  onOpenChange,
  onSaveArtifact,
}: NewArtifactComposerProps): ReactElement {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] =
    useState<ArtifactContentType>("document");
  const [driveLink, setDriveLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  function setIsOpen(value: boolean): void {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") reset();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function reset(): void {
    setName("");
    setCategory("");
    setDescription("");
    setContentType("document");
    setDriveLink("");
    setLinkError(null);
    setFormError(null);
    setSaving(false);
    setIsOpen(false);
  }

  function handleDriveLinkChange(value: string): void {
    setDriveLink(value);
    if (value && !isGoogleDriveLink(value)) {
      setLinkError(
        "O link deve ser um URL do Google Drive (drive.google.com ou docs.google.com).",
      );
    } else {
      setLinkError(null);
    }
  }

  function handleContentTypeChange(value: ArtifactContentType): void {
    setContentType(value);
    setLinkError(null);
    setDriveLink("");
  }

  function handleSave(): void {
    if (!name.trim()) {
      setFormError("O nome é obrigatório.");
      return;
    }
    if (!driveLink.trim()) {
      setFormError("O link do Google Drive é obrigatório.");
      return;
    }
    if (!isGoogleDriveLink(driveLink.trim())) {
      setFormError("Insira um link válido do Google Drive.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const artifact: Omit<
      ArtifactResponse,
      | "id"
      | "createdAt"
      | "lastEditedAt"
      | "lastEditedBy"
      | "author"
      | "findings"
    > = {
      name: name.trim(),
      contentType,
      fileLabel: fileLabelFor(contentType),
      category: category.trim() || undefined,
      description: description.trim() || "—",
      driveLink: driveLink.trim(),
    };

    onSaveArtifact?.(artifact);
    reset();
  }

  function handleBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) {
      reset();
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 bg-transparent border border-border rounded-md text-sm text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-sans";
  const selectTriggerClass =
    "w-full h-10 px-3 py-0 bg-transparent border border-border rounded-md text-sm text-foreground font-sans cursor-pointer";
  const labelClass = "block text-xs text-muted-foreground mb-1.5 font-medium";

  if (!isOpen) return <></>;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={handleBackdropMouseDown}
    >
      {/* Dialog panel */}
      <div
        ref={panelRef}
        className="bg-card border border-border rounded-xl shadow-2xl flex flex-col w-[520px] max-w-[95vw] max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border rounded-t-xl flex-shrink-0">
          <span className="text-base font-semibold text-foreground">
            Adicionar artefato
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-accent cursor-pointer border-none bg-transparent outline-none"
            title="Fechar"
            onClick={reset}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto flex-1">
          {/* Nome */}
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Nome do artefato"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError(null);
              }}
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClass}>Tipo *</label>
            <Select
              value={contentType}
              onValueChange={(value) =>
                handleContentTypeChange(value as ArtifactContentType)
              }
              disabled={saving}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Selecione um tipo">
                  {TIPO_OPTIONS.find(o => o.value === contentType)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[60]">
                {TIPO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div>
            <label className={labelClass}>Categoria</label>
            <input
              className={inputClass}
              type="text"
              placeholder="ex: Governança, Tecnologia, Processo…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              className={cn(inputClass, "resize-none")}
              rows={3}
              placeholder="Breve resumo do artefato"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Conteúdo — Google Drive link */}
          <div>
            <label className={labelClass}>Link do Google Drive *</label>
            <input
              className={cn(
                inputClass,
                linkError ? "border-destructive focus:border-destructive" : "",
              )}
              type="url"
              placeholder="https://drive.google.com/…"
              value={driveLink}
              onChange={(e) => handleDriveLinkChange(e.target.value)}
              disabled={saving}
            />
            {linkError && (
              <p className="text-destructive text-xs mt-1">{linkError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border flex-shrink-0">
          {formError && (
            <span className="flex-1 text-destructive text-xs">{formError}</span>
          )}
          <button
            className="px-4 py-1.5 bg-transparent border border-border rounded-md text-muted-foreground text-sm font-medium cursor-pointer hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
            type="button"
            onClick={reset}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-1.5 bg-primary text-primary-foreground border-none rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed outline-none"
            type="button"
            disabled={saving || !name.trim() || !!linkError}
            onClick={handleSave}
          >
            Salvar artefato
          </button>
        </div>
      </div>
    </div>
  );
}
