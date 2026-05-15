import { type ReactElement, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectResponse } from "@/api/project";

export interface ProjectFormData {
  name: string;
  startDate: string;
  endDate: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  project?: ProjectResponse;
  companyName?: string;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

export default function ProjectModal({
  isOpen,
  project,
  companyName,
  onClose,
  onSubmit,
}: ProjectModalProps): ReactElement | null {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStartDate(project.startDate?.split("T")[0] ?? "");
      setEndDate(project.endDate?.split("T")[0] ?? "");
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
    }
    setError(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!project;
  const title = isEdit ? "Editar Projeto" : "Criar Projeto";

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({ name: name.trim(), startDate, endDate });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {companyName && (
              <p className="text-sm text-muted-foreground mt-0.5">{companyName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nome do Projeto <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="Digite o nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Data Início
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="w-full [color-scheme:dark] text-foreground border-border bg-background focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Data Término
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="w-full [color-scheme:dark] text-foreground border-border bg-background focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              style={{ background: "#d4a574", color: "#0f1117" }}
            >
              {loading ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
