import { useEffect, useRef, useState, type ReactElement } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RiskPriority } from "@/api/risk";
import { priorityConfig, priorityOptions } from "@/lib/priority";

export interface RiskModalOption {
  id: string;
  label: string;
  description?: string;
}

export interface RiskModalRisk {
  id:string;
  name?: string | null;
  description?: string | null;
  consequences?: string | null;
  occurrenceProbability?: number | null;
  impactProbability?: number | null;
  damageOperations?: number | null;
  damageIndividuals?: number | null;
  damageOtherOrgs?: number | null;
  damageAssets?: number | null;
  recommendation?: string | null;
  priority?: RiskPriority | null;
  findIds?: string[] | null;
}

export interface RiskModalSubmitData {
  id?: string;
  name: string;
  description: string;
  consequences: string;
  occurrenceProbability: number;
  impactProbability: number;
  damageOperations: number;
  damageIndividuals: number;
  damageOtherOrgs: number;
  damageAssets: number;
  recommendation: string;
  priority: RiskPriority;
  findIds: string[];
}

type RiskModalField =
  | "name"
  | "description"
  | "consequences"
  | "occurrenceProbability"
  | "impactProbability"
  | "damageOperations"
  | "damageIndividuals"
  | "damageOtherOrgs"
  | "damageAssets"
  | "recommendation"
  | "priority";

interface RiskModalFormState {
  name: string;
  description: string;
  consequences: string;
  occurrenceProbability: string;
  impactProbability: string;
  damageOperations: string;
  damageIndividuals: string;
  damageOtherOrgs: string;
  damageAssets: string;
  recommendation: string;
  priority: RiskPriority;
}

interface RiskModalProps {
  open: boolean;
  loading: boolean;
  mode: "create" | "edit";
  risk?: RiskModalRisk | null;
  findings?: RiskModalOption[];
  probabilityRange?: { min: number; max: number };
  onClose: () => void;
  onSubmit: (data: RiskModalSubmitData) => void;
}

export interface RiskModalValidationErrors {
  name?: string;
  description?: string;
  consequences?: string;
  occurrenceProbability?: string;
  impactProbability?: string;
  damageOperations?: string;
  damageIndividuals?: string;
  damageOtherOrgs?: string;
  damageAssets?: string;
  recommendation?: string;
  priority?: string;
}

const PROBABILITY_MIN_DEFAULT = 0;
const PROBABILITY_MAX_DEFAULT = 100;
const DAMAGE_MIN_DEFAULT = 0;
const DAMAGE_MAX_DEFAULT = 10;

function createEmptyFormState(): RiskModalFormState {
  return {
    name: "",
    description: "",
    consequences: "",
    occurrenceProbability: "",
    impactProbability: "",
    damageOperations: "",
    damageIndividuals: "",
    damageOtherOrgs: "",
    damageAssets: "",
    recommendation: "",
    priority: "P3",
  };
}

function toInputValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function parseNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function validateRequiredText(
  value: string,
  message: string,
): string | undefined {
  if (!value.trim()) return message;
  return undefined;
}

function validateNumeric(
  value: string,
  label: string,
  min: number,
  max: number,
): string | undefined {
  const parsed = parseNumeric(value);
  if (parsed === null) {
    return `${label} deve ser um número.`;
  }
  if (parsed < min || parsed > max) {
    return `${label} deve ficar entre ${min} e ${max}.`;
  }
  return undefined;
}

function validateRiskModalDraft(
  form: RiskModalFormState,
  probMin: number,
  probMax: number,
  dmgMin: number,
  dmgMax: number,
): RiskModalValidationErrors {
  return {
    name: validateRequiredText(form.name, "Informe o nome do risco."),
    description: validateRequiredText(
      form.description,
      "Descreva o risco encontrado.",
    ),
    consequences: validateRequiredText(
      form.consequences,
      "Informe o impacto potencial para o negócio.",
    ),
    occurrenceProbability: validateNumeric(
      form.occurrenceProbability,
      "Probabilidade de ocorrência",
      probMin,
      probMax,
    ),
    impactProbability: validateNumeric(
      form.impactProbability,
      "Probabilidade de impacto",
      probMin,
      probMax,
    ),
    damageOperations: validateNumeric(
      form.damageOperations,
      "Danos às operações",
      dmgMin,
      dmgMax,
    ),
    damageIndividuals: validateNumeric(
      form.damageIndividuals,
      "Danos a indivíduos",
      dmgMin,
      dmgMax,
    ),
    damageOtherOrgs: validateNumeric(
      form.damageOtherOrgs,
      "Danos a outras organizações",
      dmgMin,
      dmgMax,
    ),
    damageAssets: validateNumeric(
      form.damageAssets,
      "Danos a ativos",
      dmgMin,
      dmgMax,
    ),
    recommendation: validateRequiredText(
      form.recommendation,
      "Informe o plano de ação sugerido.",
    ),
    priority: validateRequiredText(form.priority, "Selecione a prioridade."),
  };
}

function hasValidationErrors(errors: RiskModalValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function toggleSelection(current: string[], id: string): string[] {
  return current.includes(id)
    ? current.filter((currentId) => currentId !== id)
    : [...current, id];
}

function makeFieldId(field: RiskModalField): string {
  return `risk-${field}`;
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}): ReactElement | null {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

function LinkedOptionsSection({
  title,
  description,
  options,
  selectedIds,
  onToggle,
  emptyMessage,
  loading,
  errorMessage,
}: {
  title: string;
  description: string;
  options: RiskModalOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
  loading: boolean;
  errorMessage?: string | null;
}): ReactElement {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 w-full lg:w-1/2 h-full min-w-0">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <Badge variant="secondary">{selectedIds.length} vinculados</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando opções...</p>
      ) : errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="relative" ref={containerRef}>
          <Input
            placeholder="Pesquisar pelo nome..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full"
          />

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-foreground",
                      )}
                      onClick={() => onToggle(option.id)}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <span className="text-xs text-primary font-medium">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const selectedOption = options.find((option) => option.id === id);
            return (
              <Badge key={id} variant="outline" className="gap-1 px-2 py-1">
                {selectedOption?.label ?? id}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onToggle(id)}
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default function RiskModal({
  open,
  loading,
  mode,
  risk = null,
  findings = [],
  probabilityRange,
  onClose,
  onSubmit,
}: RiskModalProps): ReactElement {
  const probMin = probabilityRange?.min ?? PROBABILITY_MIN_DEFAULT;
  const probMax = probabilityRange?.max ?? PROBABILITY_MAX_DEFAULT;
  const dmgMin = DAMAGE_MIN_DEFAULT;
  const dmgMax = DAMAGE_MAX_DEFAULT;

  const [form, setForm] = useState<RiskModalFormState>(createEmptyFormState());
  const [findIds, setFindIds] = useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<RiskModalField, boolean>>
  >({});

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && risk) {
      setForm({
        name: toInputValue(risk.name),
        description: toInputValue(risk.description),
        consequences: toInputValue(risk.consequences),
        occurrenceProbability: toInputValue(risk.occurrenceProbability),
        impactProbability: toInputValue(risk.impactProbability),
        damageOperations: toInputValue(risk.damageOperations),
        damageIndividuals: toInputValue(risk.damageIndividuals),
        damageOtherOrgs: toInputValue(risk.damageOtherOrgs),
        damageAssets: toInputValue(risk.damageAssets),
        recommendation: toInputValue(risk.recommendation),
        priority: risk.priority ?? "P3",
      });
      setFindIds([...(risk.findIds ?? [])]);
    } else {
      setForm(createEmptyFormState());
      setFindIds([]);
    }
    setSubmitAttempted(false);
    setTouchedFields({});
  }, [open, mode, risk]);

  const errors = validateRiskModalDraft(form, probMin, probMax, dmgMin, dmgMax);
  const showError = (field: RiskModalField): string | undefined =>
    submitAttempted || touchedFields[field] ? errors[field] : undefined;

  const title =
    mode === "create" ? "Adicionar risco" : "Visualizar e editar risco";
  const subtitle =
    mode === "create"
      ? "Registre um risco com todos os campos necessários, vinculando achados e ativos afetados."
      : "Revise e ajuste o risco selecionado.";

  const primaryButtonLabel = loading
    ? mode === "create"
      ? "Registrando..."
      : "Salvando..."
    : mode === "create"
      ? "Registrar risco"
      : "Salvar alterações";

  function handleFieldChange(field: RiskModalField, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePriorityChange(value: RiskPriority): void {
    setForm((current) => ({ ...current, priority: value }));
  }

  function handleBlur(field: RiskModalField): void {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function handleSubmit(): void {
    setSubmitAttempted(true);
    const validationErrors = validateRiskModalDraft(
      form,
      probMin,
      probMax,
      dmgMin,
      dmgMax,
    );
    if (hasValidationErrors(validationErrors)) return;

    const occurrenceProbability = parseNumeric(form.occurrenceProbability);
    const impactProbability = parseNumeric(form.impactProbability);
    const damageOperations = parseNumeric(form.damageOperations);
    const damageIndividuals = parseNumeric(form.damageIndividuals);
    const damageOtherOrgs = parseNumeric(form.damageOtherOrgs);
    const damageAssets = parseNumeric(form.damageAssets);

    if (
      occurrenceProbability === null ||
      impactProbability === null ||
      damageOperations === null ||
      damageIndividuals === null ||
      damageOtherOrgs === null ||
      damageAssets === null
    ) {
      return;
    }

    onSubmit({
      id: mode === "edit" ? risk?.id : undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      consequences: form.consequences.trim(),
      occurrenceProbability,
      impactProbability,
      damageOperations,
      damageIndividuals,
      damageOtherOrgs,
      damageAssets,
      recommendation: form.recommendation.trim(),
      priority: form.priority,
      findIds: [...findIds],
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          <section className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label htmlFor={makeFieldId("name")}>Nome do risco</Label>
              <Input
                id={makeFieldId("name")}
                placeholder="Ex: Acesso indevido a dados sensíveis"
                value={form.name}
                onChange={(event) =>
                  handleFieldChange("name", event.target.value)
                }
                onBlur={() => handleBlur("name")}
                disabled={loading}
                aria-invalid={Boolean(showError("name"))}
                aria-describedby={
                  showError("name") ? `${makeFieldId("name")}-error` : undefined
                }
              />
              <FieldError
                id={`${makeFieldId("name")}-error`}
                message={showError("name")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={makeFieldId("description")}>
                Descrição do risco
              </Label>
              <Textarea
                id={makeFieldId("description")}
                placeholder="Descreva o risco encontrado"
                value={form.description}
                onChange={(event) =>
                  handleFieldChange("description", event.target.value)
                }
                onBlur={() => handleBlur("description")}
                disabled={loading}
                className="min-h-[110px]"
                aria-invalid={Boolean(showError("description"))}
                aria-describedby={
                  showError("description")
                    ? `${makeFieldId("description")}-error`
                    : undefined
                }
              />
              <FieldError
                id={`${makeFieldId("description")}-error`}
                message={showError("description")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={makeFieldId("consequences")}>Consequências</Label>
              <Textarea
                id={makeFieldId("consequences")}
                placeholder="Impacto potencial para o negócio"
                value={form.consequences}
                onChange={(event) =>
                  handleFieldChange("consequences", event.target.value)
                }
                onBlur={() => handleBlur("consequences")}
                disabled={loading}
                className="min-h-[110px]"
                aria-invalid={Boolean(showError("consequences"))}
                aria-describedby={
                  showError("consequences")
                    ? `${makeFieldId("consequences")}-error`
                    : undefined
                }
              />
              <FieldError
                id={`${makeFieldId("consequences")}-error`}
                message={showError("consequences")}
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Probabilidades</h3>
              <Badge variant="secondary">
                Escala de {probMin} a {probMax}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("occurrenceProbability")}>
                  Probabilidade de ocorrência
                </Label>
                <Input
                  id={makeFieldId("occurrenceProbability")}
                  type="number"
                  min={probMin}
                  max={probMax}
                  step="1"
                  inputMode="decimal"
                  placeholder={`${probMin} a ${probMax}`}
                  value={form.occurrenceProbability}
                  onChange={(event) =>
                    handleFieldChange(
                      "occurrenceProbability",
                      event.target.value,
                    )
                  }
                  onBlur={() => handleBlur("occurrenceProbability")}
                  disabled={loading}
                  aria-invalid={Boolean(showError("occurrenceProbability"))}
                  aria-describedby={
                    showError("occurrenceProbability")
                      ? `${makeFieldId("occurrenceProbability")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("occurrenceProbability")}-error`}
                  message={showError("occurrenceProbability")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("impactProbability")}>
                  Probabilidade de impacto
                </Label>
                <Input
                  id={makeFieldId("impactProbability")}
                  type="number"
                  min={probMin}
                  max={probMax}
                  step="1"
                  inputMode="decimal"
                  placeholder={`${probMin} a ${probMax}`}
                  value={form.impactProbability}
                  onChange={(event) =>
                    handleFieldChange("impactProbability", event.target.value)
                  }
                  onBlur={() => handleBlur("impactProbability")}
                  disabled={loading}
                  aria-invalid={Boolean(showError("impactProbability"))}
                  aria-describedby={
                    showError("impactProbability")
                      ? `${makeFieldId("impactProbability")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("impactProbability")}-error`}
                  message={showError("impactProbability")}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Use valores compatíveis com a configuração do projeto para manter
              a classificação consistente no cálculo do risco.
            </p>
          </section>

          <section className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Danos e Prioridade</h3>
              <Badge variant="secondary">
                Escala de {dmgMin} a {dmgMax}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageOperations")}>
                  Danos às operações
                </Label>
                <Input
                  type="number"
                  id={makeFieldId("damageOperations")}
                  value={form.damageOperations}
                  onChange={(e) =>
                    handleFieldChange("damageOperations", e.target.value)
                  }
                  onBlur={() => handleBlur("damageOperations")}
                  disabled={loading}
                />
                <FieldError
                  id={`${makeFieldId("damageOperations")}-error`}
                  message={showError("damageOperations")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageIndividuals")}>
                  Danos a indivíduos
                </Label>
                <Input
                  type="number"
                  id={makeFieldId("damageIndividuals")}
                  value={form.damageIndividuals}
                  onChange={(e) =>
                    handleFieldChange("damageIndividuals", e.target.value)
                  }
                  onBlur={() => handleBlur("damageIndividuals")}
                  disabled={loading}
                />
                <FieldError
                  id={`${makeFieldId("damageIndividuals")}-error`}
                  message={showError("damageIndividuals")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageOtherOrgs")}>
                  Danos a outras organizações
                </Label>
                <Input
                  type="number"
                  id={makeFieldId("damageOtherOrgs")}
                  value={form.damageOtherOrgs}
                  onChange={(e) =>
                    handleFieldChange("damageOtherOrgs", e.target.value)
                  }
                  onBlur={() => handleBlur("damageOtherOrgs")}
                  disabled={loading}
                />
                <FieldError
                  id={`${makeFieldId("damageOtherOrgs")}-error`}
                  message={showError("damageOtherOrgs")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageAssets")}>
                  Danos a ativos
                </Label>
                <Input
                  type="number"
                  id={makeFieldId("damageAssets")}
                  value={form.damageAssets}
                  onChange={(e) =>
                    handleFieldChange("damageAssets", e.target.value)
                  }
                  onBlur={() => handleBlur("damageAssets")}
                  disabled={loading}
                />
                <FieldError
                  id={`${makeFieldId("damageAssets")}-error`}
                  message={showError("damageAssets")}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={makeFieldId("priority")}>Prioridade</Label>
                <Select
                  value={form.priority}
                  onValueChange={handlePriorityChange}
                  disabled={loading}
                >
                  <SelectTrigger id={makeFieldId("priority")}>
                    <SelectValue placeholder="Selecione a prioridade">
                      {priorityConfig[form.priority]?.label || "Selecione a prioridade"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  id={`${makeFieldId("priority")}-error`}
                  message={showError("priority")}
                />
              </div>
            </div>

            <div className="grid gap-2 mt-4">
              <Label htmlFor={makeFieldId("recommendation")}>
                Recomendação
              </Label>
              <Textarea
                id={makeFieldId("recommendation")}
                placeholder="Plano de ação sugerido"
                value={form.recommendation}
                onChange={(e) =>
                  handleFieldChange("recommendation", e.target.value)
                }
                onBlur={() => handleBlur("recommendation")}
                disabled={loading}
                className="min-h-[100px]"
              />
              <FieldError
                id={`${makeFieldId("recommendation")}-error`}
                message={showError("recommendation")}
              />
            </div>
          </section>

          <div className="grid gap-4">
            <LinkedOptionsSection
              title="Vínculo com achados"
              description="Associe um ou mais achados que justificam este risco."
              options={findings}
              selectedIds={findIds}
              onToggle={(id) =>
                setFindIds((current) => toggleSelection(current, id))
              }
              emptyMessage="Nenhum achado disponível para vínculo."
              loading={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} type="button">
            {primaryButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
