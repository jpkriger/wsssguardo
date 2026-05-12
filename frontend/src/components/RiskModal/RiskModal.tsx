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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchAssetsByProject } from "@/api/asset";

export interface RiskModalOption {
  id: string;
  label: string;
  description?: string;
}

export interface RiskModalRisk {
  id: string;
  name?: string | null;
  description?: string | null;
  consequences?: string | null;
  occurrenceProbability?: number | null;
  impactProbability?: number | null;
  damageOperations?: string | null;
  damageIndividuals?: string | null;
  damageOtherOrgs?: string | null;
  recommendation?: string | null;
  riskLevel?: number | null;
  findIds?: string[] | null;
  damageAssetIds?: string[] | null;
}

export interface RiskModalSubmitData {
  id?: string;
  name: string;
  description: string;
  consequences: string;
  occurrenceProbability: number;
  impactProbability: number;
  damageOperations: string;
  damageIndividuals: string;
  damageOtherOrgs: string;
  recommendation: string;
  findIds: string[];
  damageAssetIds: string[];
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
  | "recommendation";

interface RiskModalFormState {
  name: string;
  description: string;
  consequences: string;
  occurrenceProbability: string;
  impactProbability: string;
  damageOperations: string;
  damageIndividuals: string;
  damageOtherOrgs: string;
  recommendation: string;
}

interface RiskModalProps {
  open: boolean;
  loading: boolean;
  mode: "create" | "edit";
  risk?: RiskModalRisk | null;
  findings?: RiskModalOption[];
  projectId?: string | null;
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
  recommendation?: string;
}

const PROBABILITY_MIN = 0;
const PROBABILITY_MAX = 10;

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
    recommendation: "",
  };
}

function toInputValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function parseProbability(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

function validateRequiredText(
  value: string,
  message: string,
): string | undefined {
  if (!value.trim()) {
    return message;
  }

  return undefined;
}

function validateProbability(value: string, label: string): string | undefined {
  const parsed = parseProbability(value);

  if (parsed === null) {
    return `${label} deve ser um número entre ${PROBABILITY_MIN} e ${PROBABILITY_MAX}.`;
  }

  if (parsed < PROBABILITY_MIN || parsed > PROBABILITY_MAX) {
    return `${label} deve ficar entre ${PROBABILITY_MIN} e ${PROBABILITY_MAX}.`;
  }

  return undefined;
}

export function validateRiskModalDraft(
  form: RiskModalFormState,
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
    occurrenceProbability: validateProbability(
      form.occurrenceProbability,
      "Probabilidade de ocorrência",
    ),
    impactProbability: validateProbability(
      form.impactProbability,
      "Probabilidade de impacto",
    ),
    damageOperations: validateRequiredText(
      form.damageOperations,
      "Informe os possíveis danos às operações do cliente.",
    ),
    damageIndividuals: validateRequiredText(
      form.damageIndividuals,
      "Informe os possíveis danos aos indivíduos.",
    ),
    damageOtherOrgs: validateRequiredText(
      form.damageOtherOrgs,
      "Informe os possíveis danos a outras organizações.",
    ),
    recommendation: validateRequiredText(
      form.recommendation,
      "Informe o plano de ação sugerido.",
    ),
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
  if (!message) {
    return null;
  }

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
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 justify-items-start">
          {options.map((option) => {
            const selected = selectedIds.includes(option.id);

            return (
              <Button
                key={option.id}
                type="button"
                variant={selected ? "default" : "outline"}
                className={cn(
                  "h-auto w-full max-w-[18rem] flex-col items-start gap-1 px-3 py-3 text-left min-h-[64px]",
                  !selected && "bg-background",
                )}
                onClick={() => onToggle(option.id)}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </Button>
            );
          })}
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
  projectId = null,
  onClose,
  onSubmit,
}: RiskModalProps): ReactElement {
  const [form, setForm] = useState<RiskModalFormState>(createEmptyFormState());
  const [findIds, setFindIds] = useState<string[]>([]);
  const [damageAssetIds, setDamageAssetIds] = useState<string[]>([]);
  const [assetOptions, setAssetOptions] = useState<RiskModalOption[]>([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Record<RiskModalField, boolean>
  >({
    name: false,
    description: false,
    consequences: false,
    occurrenceProbability: false,
    impactProbability: false,
    damageOperations: false,
    damageIndividuals: false,
    damageOtherOrgs: false,
    recommendation: false,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

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
        recommendation: toInputValue(risk.recommendation),
      });
      setFindIds([...(risk.findIds ?? [])]);
      setDamageAssetIds([...(risk.damageAssetIds ?? [])]);
      setSubmitAttempted(false);
      setTouchedFields({
        name: false,
        description: false,
        consequences: false,
        occurrenceProbability: false,
        impactProbability: false,
        damageOperations: false,
        damageIndividuals: false,
        damageOtherOrgs: false,
        recommendation: false,
      });
      return;
    }

    setForm(createEmptyFormState());
    setFindIds([]);
    setDamageAssetIds([]);
    setSubmitAttempted(false);
    setTouchedFields({
      name: false,
      description: false,
      consequences: false,
      occurrenceProbability: false,
      impactProbability: false,
      damageOperations: false,
      damageIndividuals: false,
      damageOtherOrgs: false,
      recommendation: false,
    });
  }, [open, mode, risk]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets(): Promise<void> {
      if (!open) {
        return;
      }

      if (!projectId) {
        setAssetOptions([]);
        setAssetError("Projeto inválido para carregar ativos.");
        setAssetLoading(false);
        return;
      }

      setAssetLoading(true);
      setAssetError(null);

      try {
        const response = await fetchAssetsByProject(projectId, 0, 1000);

        if (cancelled) {
          return;
        }

        setAssetOptions(
          response.content.map((asset) => ({
            id: asset.id,
            label: asset.name,
            description: asset.description,
          })),
        );
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Erro ao carregar ativos do projeto";
        setAssetOptions([]);
        setAssetError(message);
      } finally {
        if (!cancelled) {
          setAssetLoading(false);
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const errors = validateRiskModalDraft(form);
  const showError = (field: RiskModalField): string | undefined =>
    submitAttempted || touchedFields[field] ? errors[field] : undefined;

  const title =
    mode === "create" ? "Adicionar risco" : "Visualizar e editar risco";
  const subtitle =
    mode === "create"
      ? "Registre um risco com todos os campos necessários, vinculando achados e ativos afetados."
      : "Revise e ajuste o risco selecionado sem sair do padrão visual usado nos ativos.";

  const primaryButtonLabel = loading
    ? mode === "create"
      ? "Registrando..."
      : "Salvando..."
    : mode === "create"
      ? "Registrar risco"
      : "Salvar alterações";

  function handleFieldChange(field: RiskModalField, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleBlur(field: RiskModalField): void {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function handleSubmit(): void {
    setSubmitAttempted(true);

    const validationErrors = validateRiskModalDraft(form);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    const occurrenceProbability = parseProbability(form.occurrenceProbability);
    const impactProbability = parseProbability(form.impactProbability);

    if (occurrenceProbability === null || impactProbability === null) {
      return;
    }

    onSubmit({
      id: mode === "edit" ? risk?.id : undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      consequences: form.consequences.trim(),
      occurrenceProbability,
      impactProbability,
      damageOperations: form.damageOperations.trim(),
      damageIndividuals: form.damageIndividuals.trim(),
      damageOtherOrgs: form.damageOtherOrgs.trim(),
      recommendation: form.recommendation.trim(),
      findIds: [...findIds],
      damageAssetIds: [...damageAssetIds],
    });
  }

  const riskLevelValue =
    risk?.riskLevel === null || risk?.riskLevel === undefined
      ? "Calculado automaticamente pelo sistema"
      : String(risk.riskLevel);

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
              <Badge variant="secondary">Escala de 0 a 10</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("occurrenceProbability")}>
                  Probabilidade de ocorrência
                </Label>
                <Input
                  id={makeFieldId("occurrenceProbability")}
                  type="number"
                  min={PROBABILITY_MIN}
                  max={PROBABILITY_MAX}
                  step="0.1"
                  inputMode="decimal"
                  placeholder="0 a 10"
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
                  min={PROBABILITY_MIN}
                  max={PROBABILITY_MAX}
                  step="0.1"
                  inputMode="decimal"
                  placeholder="0 a 10"
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
              <h3 className="text-sm font-medium">Danos e recomendação</h3>
              <Badge variant="secondary">Campos obrigatórios</Badge>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageOperations")}>
                  Possíveis danos às operações
                </Label>
                <Textarea
                  id={makeFieldId("damageOperations")}
                  placeholder="Explique o impacto nas operações do cliente"
                  value={form.damageOperations}
                  onChange={(event) =>
                    handleFieldChange("damageOperations", event.target.value)
                  }
                  onBlur={() => handleBlur("damageOperations")}
                  disabled={loading}
                  className="min-h-[100px]"
                  aria-invalid={Boolean(showError("damageOperations"))}
                  aria-describedby={
                    showError("damageOperations")
                      ? `${makeFieldId("damageOperations")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("damageOperations")}-error`}
                  message={showError("damageOperations")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageIndividuals")}>
                  Possíveis danos aos indivíduos
                </Label>
                <Textarea
                  id={makeFieldId("damageIndividuals")}
                  placeholder="Explique o impacto sobre pessoas envolvidas"
                  value={form.damageIndividuals}
                  onChange={(event) =>
                    handleFieldChange("damageIndividuals", event.target.value)
                  }
                  onBlur={() => handleBlur("damageIndividuals")}
                  disabled={loading}
                  className="min-h-[100px]"
                  aria-invalid={Boolean(showError("damageIndividuals"))}
                  aria-describedby={
                    showError("damageIndividuals")
                      ? `${makeFieldId("damageIndividuals")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("damageIndividuals")}-error`}
                  message={showError("damageIndividuals")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("damageOtherOrgs")}>
                  Possíveis danos a outras organizações
                </Label>
                <Textarea
                  id={makeFieldId("damageOtherOrgs")}
                  placeholder="Explique impactos em parceiros ou terceiros"
                  value={form.damageOtherOrgs}
                  onChange={(event) =>
                    handleFieldChange("damageOtherOrgs", event.target.value)
                  }
                  onBlur={() => handleBlur("damageOtherOrgs")}
                  disabled={loading}
                  className="min-h-[100px]"
                  aria-invalid={Boolean(showError("damageOtherOrgs"))}
                  aria-describedby={
                    showError("damageOtherOrgs")
                      ? `${makeFieldId("damageOtherOrgs")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("damageOtherOrgs")}-error`}
                  message={showError("damageOtherOrgs")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={makeFieldId("recommendation")}>
                  Recomendação
                </Label>
                <Textarea
                  id={makeFieldId("recommendation")}
                  placeholder="Plano de ação sugerido"
                  value={form.recommendation}
                  onChange={(event) =>
                    handleFieldChange("recommendation", event.target.value)
                  }
                  onBlur={() => handleBlur("recommendation")}
                  disabled={loading}
                  className="min-h-[100px]"
                  aria-invalid={Boolean(showError("recommendation"))}
                  aria-describedby={
                    showError("recommendation")
                      ? `${makeFieldId("recommendation")}-error`
                      : undefined
                  }
                />
                <FieldError
                  id={`${makeFieldId("recommendation")}-error`}
                  message={showError("recommendation")}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Classificação de risco</h3>
              <Badge variant="secondary">Leitura somente</Badge>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="risk-level">Nível de risco</Label>
              <Input id="risk-level" value={riskLevelValue} disabled />
              <p className="text-xs text-muted-foreground">
                Esse valor é normalizado e recalculado pelo sistema com base nas
                configurações do projeto.
              </p>
            </div>
          </section>

          <div className="grid gap-4 lg:flex lg:items-start lg:gap-4">
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

            <LinkedOptionsSection
              title="Vínculo com ativos"
              description="Associe os ativos impactados por este risco."
              options={assetOptions}
              selectedIds={damageAssetIds}
              onToggle={(id) =>
                setDamageAssetIds((current) => toggleSelection(current, id))
              }
              emptyMessage="Nenhum ativo disponível para vínculo."
              loading={assetLoading}
              errorMessage={assetError}
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
