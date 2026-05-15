import { ReactElement, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyResponse } from "@/api/company";

interface CompanyModalProps {
  isOpen: boolean;
  company?: CompanyResponse;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CompanyModal({
  isOpen,
  company,
  onClose,
  onSubmit,
}: CompanyModalProps): ReactElement | null {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
    } else {
      setName("");
    }
    setError(null);
  }, [company, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!company;
  const title = isEdit ? "Editar Empresa" : "Criar Empresa";

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
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
              Nome da Empresa
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

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
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
