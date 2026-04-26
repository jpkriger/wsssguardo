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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { type FindingSeverity } from "../../api/finding";
import { fetchAssetsByProject, type AssetResponse } from "../../api/asset";
import { listArtifacts, type ArtifactResponse } from "../../api/artifact";
import { cn } from "../../lib/utils";
import { deriveSeverity } from "../../lib/severity";

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
  INFO: "Info",
};

const SEVERITY_BADGE: Record<FindingSeverity, string> = {
  CRITICAL: "bg-red-600/20 text-red-600",
  HIGH: "bg-red-500/20 text-red-500",
  MEDIUM: "bg-yellow-400/20 text-yellow-500",
  LOW: "bg-green-500/20 text-green-600",
  INFO: "bg-blue-400/20 text-blue-500",
};

export interface FindingModalFinding {
  id: string;
  name?: string;
  description?: string;
  numericSeverity?: number;
  category?: string;
  reference?: string;
  linkedAssetIds?: string[];
  linkedArtifactIds?: string[];
}

export interface FindingModalSubmitData {
  id?: string;
  name: string;
  description?: string;
  numericSeverity?: number;
  categoricalSeverity?: FindingSeverity;
  category?: string;
  reference?: string;
  linkedAssetIds: string[];
  linkedArtifactIds: string[];
}

interface FindingModalProps {
  open: boolean;
  loading: boolean;
  mode: "create" | "edit";
  finding?: FindingModalFinding | null;
  projectId: string;
  onClose: () => void;
  onSubmit: (data: FindingModalSubmitData) => void;
}

export default function FindingModal({
  open,
  loading,
  mode,
  finding = null,
  projectId,
  onClose,
  onSubmit,
}: FindingModalProps): ReactElement {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [numericRaw, setNumericRaw] = useState("");
  const [categoricalDerived, setCategoricalDerived] = useState<FindingSeverity | undefined>();
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<Set<string>>(new Set());
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!open) return;

    setShowValidation(false);

    if (mode === "edit" && finding) {
      setName(finding.name ?? "");
      setDescription(finding.description ?? "");
      setNumericRaw(finding.numericSeverity != null ? String(finding.numericSeverity) : "");
      setCategory(finding.category ?? "");
      setReference(finding.reference ?? "");
      setSelectedAssetIds(new Set(finding.linkedAssetIds ?? []));
      setSelectedArtifactIds(new Set(finding.linkedArtifactIds ?? []));
    } else {
      setName("");
      setDescription("");
      setNumericRaw("");
      setCategory("");
      setReference("");
      setSelectedAssetIds(new Set());
      setSelectedArtifactIds(new Set());
    }

    setLoadingData(true);
    Promise.all([
      fetchAssetsByProject(projectId, 0, 200).then((r) => setAssets(r.content)),
      listArtifacts(projectId).then(setArtifacts),
    ])
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [open, mode, finding, projectId]);

  useEffect(() => {
    const n = parseInt(numericRaw, 10);
    setCategoricalDerived(isNaN(n) ? undefined : deriveSeverity(n));
  }, [numericRaw]);

  function toggleAsset(id: string): void {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleArtifact(id: string): void {
    setSelectedArtifactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const assetError = showValidation && selectedAssetIds.size < 1;
  const artifactError = showValidation && selectedArtifactIds.size < 1;
  const isFormValid =
    name.trim() && selectedAssetIds.size >= 1 && selectedArtifactIds.size >= 1;

  function handleSubmit(): void {
    if (!isFormValid) {
      setShowValidation(true);
      return;
    }
    if (mode === "edit" && !finding?.id) return;
    const n = parseInt(numericRaw, 10);
    onSubmit({
      id: mode === "edit" ? finding?.id : undefined,
      name: name.trim(),
      description: description.trim() || undefined,
      numericSeverity: isNaN(n) ? undefined : n,
      categoricalSeverity: categoricalDerived,
      category: category.trim() || undefined,
      reference: reference.trim() || undefined,
      linkedAssetIds: [...selectedAssetIds],
      linkedArtifactIds: [...selectedArtifactIds],
    });
  }

  const title = mode === "create" ? "Novo achado" : "Editar achado";
  const subtitle =
    mode === "create"
      ? "Registre um novo achado identificado na análise"
      : "Revise e ajuste os dados do achado selecionado";
  const primaryLabel = loading
    ? mode === "create"
      ? "Registrando..."
      : "Salvando..."
    : mode === "create"
      ? "Registrar achado"
      : "Salvar alterações";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="finding-name">Nome *</Label>
            <Input
              id="finding-name"
              placeholder="Nome do achado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {showValidation && !name.trim() && (
              <p className="text-xs text-destructive">Nome é obrigatório</p>
            )}
          </div>

          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="finding-description">Descrição</Label>
            <Textarea
              id="finding-description"
              placeholder="Descreva o achado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="min-h-[80px]"
            />
          </div>

          {/* Severidade numérica + categórica derivada */}
          <div className="grid gap-2">
            <Label htmlFor="finding-severity">Severidade Numérica</Label>
            <div className="flex items-center gap-3">
              <Input
                id="finding-severity"
                type="number"
                placeholder="1 – 10"
                value={numericRaw}
                onChange={(e) => setNumericRaw(e.target.value)}
                disabled={loading}
                className="w-32"
              />
              {categoricalDerived ? (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    SEVERITY_BADGE[categoricalDerived],
                  )}
                >
                  {SEVERITY_LABELS[categoricalDerived]}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  1–3 INFO · 4–5 LOW · 6–7 MEDIUM · 8–9 HIGH · 10 CRITICAL
                </span>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div className="grid gap-2">
            <Label htmlFor="finding-category">Categoria</Label>
            <Input
              id="finding-category"
              placeholder="Ex: Injection, Auth, XSS..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Referência */}
          <div className="grid gap-2">
            <Label htmlFor="finding-reference">Referência</Label>
            <Input
              id="finding-reference"
              placeholder="Ex: CWE-89, OWASP A03:2021..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Ativos vinculados */}
          <div className="grid gap-2">
            <Label>
              Ativos vinculados *
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (mín. 1)
              </span>
            </Label>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Carregando ativos…</p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum ativo cadastrado neste projeto.
              </p>
            ) : (
              <div
                className={cn(
                  "rounded-md border p-3 max-h-36 overflow-y-auto flex flex-col gap-1",
                  assetError ? "border-destructive" : "border-border",
                )}
              >
                {assets.map((asset) => (
                  <label
                    key={asset.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground/80"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedAssetIds.has(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                      disabled={loading}
                    />
                    {asset.name}
                  </label>
                ))}
              </div>
            )}
            {assetError && (
              <p className="text-xs text-destructive">Selecione ao menos 1 ativo</p>
            )}
          </div>

          {/* Artefatos vinculados */}
          <div className="grid gap-2">
            <Label>
              Artefatos vinculados *
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (mín. 1)
              </span>
            </Label>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Carregando artefatos…</p>
            ) : artifacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum artefato cadastrado neste projeto.
              </p>
            ) : (
              <div
                className={cn(
                  "rounded-md border p-3 max-h-36 overflow-y-auto flex flex-col gap-1",
                  artifactError ? "border-destructive" : "border-border",
                )}
              >
                {artifacts.map((artifact) => (
                  <label
                    key={artifact.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground/80"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedArtifactIds.has(artifact.id)}
                      onChange={() => toggleArtifact(artifact.id)}
                      disabled={loading}
                    />
                    {artifact.name}
                  </label>
                ))}
              </div>
            )}
            {artifactError && (
              <p className="text-xs text-destructive">Selecione ao menos 1 artefato</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
