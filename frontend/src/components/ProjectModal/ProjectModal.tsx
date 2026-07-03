import { type ReactElement, useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const dateInputClassName =
  "[color-scheme:dark] text-foreground border-border bg-background focus-visible:ring-primary/40 focus-visible:border-primary/60 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0";

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
  // Buffers de texto livre para os campos de range: o usuário digita aqui sem
  // nenhuma validação/parse a cada tecla. Só viram número (e disparam a
  // redistribuição das categorias) no blur, via commitGlobalRange/commitCategoryRange.
  // Sem isso, o <input type="number"> controlado recalculava o valor a cada tecla e
  // perdia a posição do cursor, fazendo o dígito novo substituir o anterior.
  const [minRangeText, setMinRangeText] = useState(String(createDefaultRiskConfig().minRange));
  const [maxRangeText, setMaxRangeText] = useState(String(createDefaultRiskConfig().maxRange));
  const [categoryRangeText, setCategoryRangeText] = useState<Record<string, string>>({});
  const [consultantIds, setConsultantIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStartDate(project.startDate?.split("T")[0] ?? "");
      setEndDate(project.endDate?.split("T")[0] ?? "");
      setConsultantIds(project.consultantIds ?? []);
    } else {
      const defaultConfig = createDefaultRiskConfig();
      setName("");
      setStartDate("");
      setEndDate("");
      setRiskConfig(defaultConfig);
      setMinRangeText(String(defaultConfig.minRange));
      setMaxRangeText(String(defaultConfig.maxRange));
      setCategoryRangeText({});
      setConsultantIds([]);
    }
    setUserSearch("");
    void listUsers().then(setUsers).catch(() => setUsers([]));
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

  const isEdit = !!project;
  const title = isEdit ? "Editar Projeto" : "Criar Projeto";
  const subtitle = companyName
    ? `${companyName}`
    : isEdit
      ? "Revise os dados principais do projeto."
      : "Cadastre o projeto, consultores e matriz inicial de risco.";

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

  const updateGlobalRange = (field: "minRange" | "maxRange", rawValue: string): void => {
    if (rawValue.trim() === "") return;
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;

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

  // Chamado no blur dos campos de range global: aplica o valor digitado e
  // limpa os buffers de texto das categorias, já que a redistribuição acima
  // recalcula o min/max de todas elas.
  const commitGlobalRange = (field: "minRange" | "maxRange", rawValue: string): void => {
    updateGlobalRange(field, rawValue);
    setCategoryRangeText({});

    // Ressincroniza o buffer de texto com o valor autoritativo (mesma lógica dos
    // campos de categoria): se o input ficou vazio/inválido, updateGlobalRange
    // manteve o valor antigo, então voltamos a exibi-lo em vez do texto digitado.
    const trimmed = rawValue.trim();
    const parsed = Number(trimmed);
    const committed =
      trimmed !== "" && !Number.isNaN(parsed) ? parsed : riskConfig[field];
    const setBuffer = field === "minRange" ? setMinRangeText : setMaxRangeText;
    setBuffer(String(committed));
  };

  const updateCategory = (index: number, field: keyof RiskCategoryDTO, value: string | number): void => {
    if (field === "minRange" || field === "maxRange") {
      if (typeof value === "string") {
        if (value.trim() === "") return;
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return;
        value = parsed;
      }
    }

    setRiskConfig((prev) => {
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], [field]: value };
      return { ...prev, categories };
    });
  };

  // Chamado no blur dos campos "De"/"Até" de cada nível: aplica o valor e
  // limpa o buffer de texto daquele campo, voltando a exibir o número
  // autoritativo (cat.minRange/maxRange) em vez do texto que estava sendo digitado.
  const commitCategoryRange = (
    index: number,
    field: "minRange" | "maxRange",
    bufferKey: string,
    rawValue: string,
  ): void => {
    updateCategory(index, field, rawValue);
    setCategoryRangeText((prev) => {
      const next = { ...prev };
      delete next[bufferKey];
      return next;
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
    setCategoryRangeText({});
  };

  const removeCategory = (index: number): void => {
    setRiskConfig((prev) => {
      const newCategories = prev.categories.filter((_, i) => i !== index);
      return {
        ...prev,
        categories: redistributeCategories(newCategories, prev.minRange, prev.maxRange),
      };
    });
    setCategoryRangeText({});
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
        consultantIds,
        ...(isEdit ? {} : { riskConfig }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-border px-7 py-5">
          <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
              <section className="flex min-h-0 flex-col gap-6">
                <div className="shrink-0 space-y-5 rounded-lg border border-border bg-background/60 p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Dados do projeto</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Informe o nome e o período planejado.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="project-name">
                      Nome do Projeto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="project-name"
                      type="text"
                      placeholder="Digite o nome..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="project-start-date">Data Início</Label>
                      <Input
                        id="project-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={loading}
                        className={dateInputClassName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="project-end-date">Data Término</Label>
                      <Input
                        id="project-end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={loading}
                        className={dateInputClassName}
                      />
                    </div>
                  </div>
                </div>

                {!isEdit && (
                  <div className="flex min-h-0 flex-col gap-5 rounded-lg border border-border bg-background/60 p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Configuração de Risco
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Defina o range e os níveis qualitativos de risco do projeto.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="risk-min-range">Valor Mínimo</Label>
                        <Input
                          id="risk-min-range"
                          type="text"
                          inputMode="numeric"
                          value={minRangeText}
                          onChange={(e) => setMinRangeText(e.target.value)}
                          onBlur={(e) => commitGlobalRange("minRange", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="risk-max-range">Valor Máximo</Label>
                        <Input
                          id="risk-max-range"
                          type="text"
                          inputMode="numeric"
                          value={maxRangeText}
                          onChange={(e) => setMaxRangeText(e.target.value)}
                          onBlur={(e) => commitGlobalRange("maxRange", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-xs text-muted-foreground">
                          Níveis de risco
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={addCategory}
                          disabled={loading}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar
                        </Button>
                      </div>

                      <ScrollArea className="max-h-70 min-h-0 pr-3">
                        <div className="space-y-2">
                          {riskConfig.categories.map((cat, index) => (
                            <div
                              key={index}
                              className="grid gap-3 rounded-md border border-border bg-muted/20 p-3.5 md:grid-cols-[minmax(0,1fr)_112px_112px_36px] md:items-end"
                            >
                              <div className="grid gap-1.5">
                                <Label htmlFor={`cat-label-${index}`} className="text-xs">
                                  Nome
                                </Label>
                                <Input
                                  id={`cat-label-${index}`}
                                  type="text"
                                  placeholder="Ex: Baixo"
                                  value={cat.label}
                                  onChange={(e) =>
                                    updateCategory(index, "label", e.target.value)
                                  }
                                  disabled={loading}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <Label htmlFor={`cat-min-${index}`} className="text-xs">
                                  De
                                </Label>
                                <Input
                                  id={`cat-min-${index}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={categoryRangeText[`${index}-min`] ?? String(cat.minRange)}
                                  onChange={(e) =>
                                    setCategoryRangeText((prev) => ({
                                      ...prev,
                                      [`${index}-min`]: e.target.value,
                                    }))
                                  }
                                  onBlur={(e) =>
                                    commitCategoryRange(index, "minRange", `${index}-min`, e.target.value)
                                  }
                                  disabled={loading}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <Label htmlFor={`cat-max-${index}`} className="text-xs">
                                  Até
                                </Label>
                                <Input
                                  id={`cat-max-${index}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={categoryRangeText[`${index}-max`] ?? String(cat.maxRange)}
                                  onChange={(e) =>
                                    setCategoryRangeText((prev) => ({
                                      ...prev,
                                      [`${index}-max`]: e.target.value,
                                    }))
                                  }
                                  onBlur={(e) =>
                                    commitCategoryRange(index, "maxRange", `${index}-max`, e.target.value)
                                  }
                                  disabled={loading}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="justify-self-end text-destructive hover:bg-destructive/10 hover:text-destructive md:justify-self-auto"
                                onClick={() => removeCategory(index)}
                                disabled={loading || riskConfig.categories.length <= 1}
                                aria-label={`Remover nível ${cat.label || index + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </section>

              {users.length > 0 && (
                <aside className="flex min-h-0 flex-col gap-4 self-stretch overflow-hidden rounded-lg border border-border bg-background/60 p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Consultores</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Selecione os consultores que terão acesso ao projeto.
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                  <ScrollArea className="max-h-150 min-h-0 flex-1 rounded-md border border-border bg-background/40">
                    {filteredUsers.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                        Nenhum usuário encontrado.
                      </p>
                    ) : (
                      filteredUsers.map((u) => {
                        const checked = consultantIds.includes(u.id);
                        const label =
                          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          u.email ||
                          u.id;
                        return (
                          <label
                            key={u.id}
                            className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 transition-colors last:border-b-0 hover:bg-muted/30"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleConsultant(u.id)}
                              className="h-4 w-4 rounded accent-brand"
                              disabled={loading}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm text-foreground">
                                {label}
                              </span>
                              {u.email && (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {u.email}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">
                    {consultantIds.length} consultor
                    {consultantIds.length === 1 ? "" : "es"} selecionado
                    {consultantIds.length === 1 ? "" : "s"}
                  </p>
                </aside>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-7 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
