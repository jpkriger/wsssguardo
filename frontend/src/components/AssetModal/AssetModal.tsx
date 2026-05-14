import { useEffect, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface AssetModalAsset {
  id: string;
  name?: string;
  description?: string;
  content?: string;
}

export interface AssetModalSubmitData {
  id?: string;
  name: string;
  description: string;
  content: string;
}

interface AssetModalProps {
  open: boolean;
  loading: boolean;
  mode: "create" | "edit";
  asset?: AssetModalAsset | null;
  onClose: () => void;
  onSubmit: (data: AssetModalSubmitData) => void;
}

export default function AssetModal({
  open,
  loading,
  mode,
  asset = null,
  onClose,
  onSubmit,
}: AssetModalProps): ReactElement {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [urlError, setUrlError] = useState("");

  const isValidUrl = (value: string) => {

    value = value.trim();

    try {
      if (!/^https?:\/\//i.test(value)) return false;

      const url = new URL(value);

      const hostname = url.hostname;
      const parts = hostname.split(".");

      if (parts.length < 2) return false;

      const tld = parts[parts.length - 1];
      if (tld.length < 2) return false;

      if (parts.some((p) => p.length === 0)) return false;

      return true;
    } catch {
      return false;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContent(value);

    if (value && !isValidUrl(value)) {
      setUrlError("Por favor, insira uma URL válida. (Ex: https://wsssguardo.com.br)");
    } else {
      setUrlError("");
    }
  };

  useEffect(() => {
    if (!open) return;

    setUrlError("");

    if (mode === "edit" && asset) {
      setName(asset.name ?? "");
      setDescription(asset.description ?? "");
      setContent(asset.content ?? "");
      return;
    }

    setName("");
    setDescription("");
    setContent("");
  }, [open, mode, asset]);

  const title =
    mode === "create" ? "Adicionar Ativo" : "Visualizar e editar ativo";

  const subtitle =
    mode === "create"
      ? "Registre um novo ativo vinculado ao projeto"
      : "Revise e ajuste os dados do ativo selecionado";

  const primaryButtonLabel = loading
    ? mode === "create"
      ? "Registrando..."
      : "Salvando..."
    : mode === "create"
      ? "Registrar ativo"
      : "Salvar alterações";

  const isSubmitDisabled =
    loading ||
    !name.trim() ||
    !description.trim() ||
    !content.trim() ||
    !!urlError;

  function handleSubmit(): void {
    if (mode === "edit" && !asset?.id) return;

    if (!isValidUrl(content)) {
      setUrlError("Por favor, insira uma URL válida. (Ex: https://wsssguardo.com.br)");
      return;
    }

    onSubmit({
      id: mode === "edit" ? asset?.id : undefined,
      name: name.trim(),
      description: description.trim(),
      content: content.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="asset-name">Nome do ativo</Label>
            <Input
              id="asset-name"
              placeholder="Nome do ativo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asset-description">Descrição do ativo</Label>
            <Input
              id="asset-description"
              placeholder="Descrição do ativo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asset-content">Referência / URL</Label>
            <Input
              id="asset-content"
              placeholder="Ex: https://google.com.br"
              value={content}
              onChange={handleContentChange}
              disabled={loading}
              className={
                urlError ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {urlError && <p className="text-sm text-red-500">{urlError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {primaryButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}