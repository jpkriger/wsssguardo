import { type ReactElement, useEffect, useState } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ProjectResponse } from "@/api/project";
import type { RiskCategoryDTO, RiskConfigDTO } from "@/api/projectConfiguration";
import { listUsers, type UserProfile } from "@/api/users";

export interface ProjectFormData {
  name: string;
  startDate: string;
  endDate: string;
  riskConfig?: RiskConfigDTO;
  consultantIds?: string[];
}

interface ProjectModalProps {
  isOpen: boolean;
  project?: ProjectResponse;
  companyName?: string;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

function createDefaultCategories(): RiskCategoryDTO[] {
  return [
    { label: "Baixo", minRange: 0, maxRange: 3 },
    { label: "Médio", minRange: 4, maxRange: 7 },
    { label: "Alto", minRange: 8, maxRange: 10 },
  ];
}

function createDefaultRiskConfig(): RiskConfigDTO {
  return {
    minRange: 0,
    maxRange: 10,
    categories: createDefaultCategories(),
  };
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

  const [riskConfig, setRiskConfig] = useState<RiskConfigDTO>(createDefaultRiskConfig());
  const [consultantIds, setConsultantIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStartDate(project.startDate?.split("T")[0] ?? "");
      setEndDate(project.endDate?.split("T")[0] ?? "");
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
      setRiskConfig(createDefaultRiskConfig());
      setConsultantIds([]);
      setUserSearch("");
      void listUsers().then(setUsers).catch(() => setUsers([]));
    }
    setError(null);
  }, [project, isOpen]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.firstName ?? "").toLowerCase().includes(q) ||
      (u.lastName ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  function toggleConsultant(id: string): void {
    setConsultantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!isOpen) return null;

  const isEdit = !!project;
  const title = isEdit ? "Editar Projeto" : "Criar Projeto";

  const redistributeCategories = (
    categories: RiskCategoryDTO[],
    newMin: number,
    newMax: number,
  ): RiskCategoryDTO[] => {
    const count = categories.length;
    if (count === 0 || newMin >= newMax) return categories;
    const totalSize = newMax - newMin + 1;
    const baseSize = Math.floor(totalSize / count);
    const remainder = totalSize % count;
    let currentMin = newMin;
    return categories.map((cat, i) => {
      const size = baseSize + (i < remainder ? 1 : 0);
      const catMin = currentMin;
      const catMax = Math.max(catMin, currentMin + size - 1);
      currentMin = catMax + 1;
      return {
        ...cat,
        minRange: catMin,
        maxRange: catMax,
      };
    });
  };

  const updateGlobalRange = (field: "minRange" | "maxRange", value: number): void => {
    setRiskConfig((prev) => {
      const newMin = field === "minRange" ? value : prev.minRange;
      const newMax = field === "maxRange" ? value : prev.maxRange;
      return {
        ...prev,
        minRange: newMin,
        maxRange: newMax,
        categories: redistributeCategories(prev.categories, newMin, newMax),
      };
    });
  };

  const updateCategory = (index: number, field: keyof RiskCategoryDTO, value: string | number): void => {
    setRiskConfig((prev) => {
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], [field]: value };
      return { ...prev, categories };
    });
  };

  const addCategory = (): void => {
    setRiskConfig((prev) => {
      const newCategories = [
        ...prev.categories,
        { label: "", minRange: 0, maxRange: 0 },
      ];
      return {
        ...prev,
        categories: redistributeCategories(newCategories, prev.minRange, prev.maxRange),
      };
    });
  };

  const removeCategory = (index: number): void => {
    setRiskConfig((prev) => {
      const newCategories = prev.categories.filter((_, i) => i !== index);
      return {
        ...prev,
        categories: redistributeCategories(newCategories, prev.minRange, prev.maxRange),
      };
    });
  };

  const validateRiskConfig = (): string | null => {
    if (riskConfig.minRange >= riskConfig.maxRange) {
      return "O valor mínimo deve ser menor que o valor máximo do range.";
    }
    if (riskConfig.categories.length === 0) {
      return "É necessário ao menos um nível de risco.";
    }
    for (const cat of riskConfig.categories) {
      if (!cat.label.trim()) {
        return "Todos os níveis devem ter um nome.";
      }
      if (cat.minRange >= cat.maxRange) {
        return `O nível "${cat.label}" tem range inválido (mín deve ser menor que máx).`;
      }
      if (cat.minRange < riskConfig.minRange || cat.maxRange > riskConfig.maxRange) {
        return `O nível "${cat.label}" está fora do range global (${riskConfig.minRange}–${riskConfig.maxRange}).`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!isEdit) {
      const riskError = validateRiskConfig();
      if (riskError) {
        setError(riskError);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        startDate,
        endDate,
        ...(isEdit ? {} : { riskConfig, consultantIds }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="project-name" className="mb-1">
              Nome do Projeto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
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
              <Label htmlFor="project-start-date" className="mb-1">
                Data Início
              </Label>
              <Input
                id="project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="w-full [color-scheme:dark] text-foreground border-border bg-background focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
              />
            </div>
            <div>
              <Label htmlFor="project-end-date" className="mb-1">
                Data Término
              </Label>
              <Input
                id="project-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="w-full [color-scheme:dark] text-foreground border-border bg-background focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
              />
            </div>
          </div>

          {!isEdit && users.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Consultores</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecione os consultores que terão acesso ao projeto.
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-md border border-border divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum usuário encontrado.
                    </p>
                  ) : (
                    filteredUsers.map((u) => {
                      const checked = consultantIds.includes(u.id);
                      const label = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id;
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleConsultant(u.id)}
                            className="h-3.5 w-3.5 rounded accent-[#d4a574]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{label}</p>
                            {u.email && (
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {consultantIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {consultantIds.length} consultor{consultantIds.length > 1 ? "es" : ""} selecionado{consultantIds.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </>
          )}

          {!isEdit && (
            <>
              <Separator />

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Configuração de Risco
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Defina o range e os níveis qualitativos de risco do projeto.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="risk-min-range" className="mb-1">
                      Valor Mínimo
                    </Label>
                    <Input
                      id="risk-min-range"
                      type="number"
                      value={riskConfig.minRange}
                      onChange={(e) =>
                        updateGlobalRange("minRange", Number(e.target.value))
                      
                      }
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-max-range" className="mb-1">
                      Valor Máximo
                    </Label>
                    <Input
                      id="risk-max-range"
                      type="number"
                      value={riskConfig.maxRange}
                      onChange={(e) =>
                        updateGlobalRange("maxRange", Number(e.target.value))
                      
                      }
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Níveis de risco
                  </Label>

                  {riskConfig.categories.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-2 p-3 rounded-md border border-border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`cat-label-${index}`} className="mb-1 text-xs">
                          Nome
                        </Label>
                        <Input
                          id={`cat-label-${index}`}
                          type="text"
                          placeholder="Ex: Baixo"
                          value={cat.label}
                          onChange={(e) => updateCategory(index, "label", e.target.value)}
                          disabled={loading}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-20">
                        <Label htmlFor={`cat-min-${index}`} className="mb-1 text-xs">
                          De
                        </Label>
                        <Input
                          id={`cat-min-${index}`}
                          type="number"
                          value={cat.minRange}
                          onChange={(e) => updateCategory(index, "minRange", Number(e.target.value))}
                          disabled={loading}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-20">
                        <Label htmlFor={`cat-max-${index}`} className="mb-1 text-xs">
                          Até
                        </Label>
                        <Input
                          id={`cat-max-${index}`}
                          type="number"
                          value={cat.maxRange}
                          onChange={(e) => updateCategory(index, "maxRange", Number(e.target.value))}
                          disabled={loading}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeCategory(index)}
                        disabled={loading || riskConfig.categories.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={addCategory}
                    disabled={loading}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Nível
                  </Button>
                </div>
              </div>
            </>
          )}

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
