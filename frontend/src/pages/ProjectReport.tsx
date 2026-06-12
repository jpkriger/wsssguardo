import { ReactElement, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  Expand,
  ChevronDown,
  EyeIcon,
  File,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import ExecutiveSummary from "../components/ReportTemplate/ExecutiveSummary/ExecutiveSummary";
import RiskOverview from "../components/ReportTemplate/RiskOverview/RiskOverview";
import RiskAnalysis from "../components/ReportTemplate/RiskAnalysis/RiskAnalysis";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { projectsById, type ProjectResponse } from "../api/project";
import {
  fetchRisksByProject,
  getRiskSummary,
  type RiskResponse,
  type RiskSummaryResponse,
} from "../api/risk";
import { listCompanies } from "../api/company";
import { cn } from "../lib/utils";
import { exportPreviewAsHtml } from "../lib/reportExport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import ReportHeader from "@/components/ReportTemplate/ReportHeader/ReportHeader";
import BusinessImpactAssessment from "@/components/ReportTemplate/BusinessImpactAssessment/BusinessImpactAssessment";

function formatDateBr(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function parseProjectEndDate(value: string): Date {
  const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const REPORT_SECTIONS = [
  {
    key: "summary",
    label: "Resumo",
  },
  {
    key: "riskTable",
    label: "Tabela de Riscos",
  },
  {
    key: "riskDetails",
    label: "Detalhamento de Riscos",
  },
  {
    key: "assetsArtifacts",
    label: "Ativos e Artefatos",
  },
  {
    key: "recommendations",
    label: "Recomendações",
  },
  {
    key: "impactAssessment",
    label: "Avaliação de Impacto",
  },
] as const;

type DetailLevel = "executivo" | "tecnico";

const DETAIL_LEVELS: {
  key: DetailLevel;
  label: string;
  description: string;
}[] = [
  { key: "executivo", label: "Executivo", description: "Visão resumida" },
  { key: "tecnico", label: "Técnico", description: "Dados completos" },
];

interface FormState {
  title: string;
  client: string;
  date: string;
  responsible: string;
  summary: string;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildInitialFormState(project: ProjectResponse | null, companyName?: string): FormState {
  return {
    title: project?.name ?? "",
    client: companyName ?? project?.companyId ?? "",
    date: getTodayIsoDate(),
    responsible: "Equipe de análise",
    summary: project ? `Resumo executivo do projeto ${project.name}.` : "",
  };
}

function buildSectionState(): Record<string, boolean> {
  return Object.fromEntries(REPORT_SECTIONS.map((s) => [s.key, true]));
}

function buildRiskSelectionState(
  risks: RiskResponse[],
): Record<string, boolean> {
  return Object.fromEntries(risks.map((risk) => [risk.id, true]));
}

export default function ProjectReport(): ReactElement {
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | undefined>();
  const [riskSummary, setRiskSummary] = useState<RiskSummaryResponse | null>(
    null,
  );
  const [loadingRiskSummary, setLoadingRiskSummary] = useState(true);
  const [loadingProjectRisks, setLoadingProjectRisks] = useState(true);
  const [formState, setFormState] = useState<FormState>(() =>
    buildInitialFormState(null),
  );
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("executivo");
  const [sectionsEnabled, setSectionsEnabled] = useState<
    Record<string, boolean>
  >(() => buildSectionState());
  const [projectRisks, setProjectRisks] = useState<RiskResponse[]>([]);
  const [selectedRiskIds, setSelectedRiskIds] = useState<
    Record<string, boolean>
  >({});
  const [riskTableExpanded, setRiskTableExpanded] = useState(false);
  const [riskDetailsExpanded, setRiskDetailsExpanded] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const exportTitle = formState.title.trim() || project?.name || "Relatório";

  function handleExportHtml(): void {
    if (!previewRef.current) return;
    try {
      exportPreviewAsHtml(previewRef.current, exportTitle);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao exportar o relatório.";
      toast.error(message);
    }
  }

  useEffect(() => {
    setFormState(buildInitialFormState(project, companyName));
  }, [project, companyName]);

  useEffect(() => {
    let cancelled = false;

    async function loadProject(): Promise<void> {
      if (!projectId) {
        setProject(null);
        setProjectError("Projeto inválido.");
        setLoadingProject(false);
        return;
      }

      setLoadingProject(true);
      setProjectError(null);

      try {
        const [response] = await projectsById([projectId]);
        if (cancelled) return;

        if (!response) {
          setProject(null);
          setProjectError("Projeto não encontrado.");
          return;
        }

        setProject(response);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Erro ao carregar projeto";
        setProjectError(message);
      } finally {
        if (!cancelled) {
          setLoadingProject(false);
        }
      }
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompanyNameData(): Promise<void> {
      if (!project?.companyId) {
        setCompanyName(undefined);
        return;
      }

      try {
        const companies = await listCompanies();
        if (cancelled) return;

        const company = companies.find((c) => c.id === project.companyId);
        setCompanyName(company?.name);
      } catch {
        if (!cancelled) {
          setCompanyName(undefined);
        }
      }
    }

    void loadCompanyNameData();

    return () => {
      cancelled = true;
    };
  }, [project?.companyId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectRisks(): Promise<void> {
      if (!projectId) {
        setProjectRisks([]);
        setSelectedRiskIds({});
        setLoadingProjectRisks(false);
        return;
      }

      setLoadingProjectRisks(true);

      try {
        const response = await fetchRisksByProject(projectId, 0, 1000);
        if (cancelled) return;

        setProjectRisks(response.content);
        setSelectedRiskIds(buildRiskSelectionState(response.content));
      } catch {
        if (cancelled) return;

        setProjectRisks([]);
        setSelectedRiskIds({});
      } finally {
        if (!cancelled) {
          setLoadingProjectRisks(false);
        }
      }
    }

    void loadProjectRisks();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRiskSummary(): Promise<void> {
      if (!projectId) {
        setRiskSummary(null);
        setLoadingRiskSummary(false);
        return;
      }

      setLoadingRiskSummary(true);

      try {
        const summary = await getRiskSummary(projectId);
        if (!cancelled) {
          setRiskSummary(summary);
        }
      } catch {
        if (!cancelled) {
          setRiskSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRiskSummary(false);
        }
      }
    }

    void loadRiskSummary();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function toggleProjectRisk(riskId: string): void {
    setSelectedRiskIds((current) => ({
      ...current,
      [riskId]: !current[riskId],
    }));
  }

  const includedRisksCount = projectRisks.filter(
    (risk) => selectedRiskIds[risk.id],
  ).length;
  const totalRisksCount = riskSummary?.total ?? projectRisks.length;

  const previewBody = (
    <>
      <ReportHeader
        projectId={projectId}
        title={formState.title}
        client={formState.client}
        date={new Date(formState.date + "T12:00:00")}
      />

      {detailLevel === "executivo" ? (
        <>
          {sectionsEnabled["summary"] && (
            <ExecutiveSummary
              projectId={projectId}
              customSummary={formState.summary}
              highRisks={riskSummary?.highRisks}
              mediumRisks={riskSummary?.mediumRisks}
            />
          )}
          {sectionsEnabled["impactAssessment"] && (
            <BusinessImpactAssessment />
          )}
          {sectionsEnabled["riskTable"] && (
            <RiskOverview projectId={projectId} />
          )}
        </>
      ) : (
        <>
          {sectionsEnabled["summary"] && (
            <ExecutiveSummary
              projectId={projectId}
              customSummary={formState.summary}
              highRisks={riskSummary?.highRisks}
              mediumRisks={riskSummary?.mediumRisks}
            />
          )}
          {sectionsEnabled["riskTable"] && (
            <RiskOverview projectId={projectId} />
          )}
          {sectionsEnabled["riskDetails"] && (
            <RiskAnalysis
              projectId={projectId}
              selectedRiskIds={selectedRiskIds}
              showAssetsArtifacts={!!sectionsEnabled["assetsArtifacts"]}
              showRecommendations={!!sectionsEnabled["recommendations"]}
            />
          )}
          {sectionsEnabled["impactAssessment"] && (
            <BusinessImpactAssessment />
          )}
        </>
      )}
    </>
  );

  return (
    <section className="flex h-full min-h-0 flex-col w-full">
      <div>
        <Link
          to={projectId ? `/project/${projectId}` : "/projects"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para o projeto
        </Link>

        <header className="mt-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {project?.name ?? "Projeto"}
            </h1>

            <div className="flex items-center gap-2">
              {(() => {
                if (loadingProject || projectError) return null;
                if (!project?.endDate)
                  return (
                    <span className="text-xl sm:text-2xl font-semibold tracking-tight text-muted-foreground">
                      Sem prazo definido
                    </span>
                  );

                const endDate = startOfDay(parseProjectEndDate(project.endDate));
                const today = startOfDay(new Date());
                const daysRemaining = Math.floor(
                  (endDate.getTime() - today.getTime()) / 86_400_000,
                );

                if (daysRemaining < 0) {
                  return (
                    <span className="text-xl sm:text-2xl font-semibold tracking-tight text-muted-foreground">
                      {`Encerrado em ${formatDateBr(endDate)}`}
                    </span>
                  );
                }

                let colorText = "text-success";
                if (daysRemaining <= 7) colorText = "text-destructive";
                else if (daysRemaining <= 15) colorText = "text-warning";

                return (
                  <span className={`text-xl sm:text-2xl font-semibold tracking-tight ${colorText}`}>
                    {`Faltam ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} - Encerra em ${formatDateBr(endDate)}`}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="mt-2">
            {loadingProject ? (
              <span className="text-sm text-muted-foreground">
                Carregando dados do projeto...
              </span>
            ) : projectError ? (
              <span className="text-sm text-destructive">{projectError}</span>
            ) : null}
          </div>
        </header>
      </div>

      <div className="mt-6 grid flex-1 min-h-0 gap-0 lg:-mx-40 lg:w-[calc(100%+20rem)] lg:max-w-none lg:grid-cols-[45%_55%] lg:items-stretch">
        <Card className="flex min-h-0 w-full flex-col gap-0 rounded-none border-border bg-card/80 py-0 shadow-sm backdrop-blur lg:h-[calc(100vh-14rem)]">
          <CardHeader className="flex min-h-12 items-center border-b border-border px-5 [.border-b]:pb-0 rounded-none">
            <CardTitle className="text-primary">
              CONFIGURAÇÃO DO RELATÓRIO
            </CardTitle>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <section>
                <CardTitle className="text-sm tracking-wider text-muted-foreground">
                  NÍVEL DE DETALHE
                </CardTitle>

                <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
                  {DETAIL_LEVELS.map((level) => {
                    const isActive = detailLevel === level.key;

                    return (
                      <button
                        key={level.key}
                        type="button"
                        onClick={() => setDetailLevel(level.key)}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-md border px-4 py-3 text-left transition-colors",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40",
                        )}
                        aria-pressed={isActive}
                      >
                        <span className="text-base font-medium text-foreground">
                          {level.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {level.description}
                        </span>
                        <span
                          className={cn(
                            "mt-1 h-1 w-6 rounded-full transition-colors",
                            isActive ? "bg-primary" : "bg-transparent",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              <Separator />

              <section>
                <div className="justify-between">
                  <div>
                    <CardTitle className="text-sm tracking-wider text-muted-foreground">
                      SEÇÕES DO RELATÓRIO
                    </CardTitle>
                  </div>
                </div>

                <div className="px-0 pb-4 pt-2">
                  <div className="space-y-3">
                    {REPORT_SECTIONS.map((section) => {
                      const skey = section.key;
                      const slabel = section.label;
                      const isRiskTable = skey === "riskTable";
                      const isRiskDetails = skey === "riskDetails";
                      const isRiskDetailChild =
                        skey === "assetsArtifacts" || skey === "recommendations";

                      if (isRiskDetailChild) {
                        return null;
                      }

                      return (
                        <div key={skey} className="space-y-2">
                          <div className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors">
                            <div className="min-w-0">
                              <div className="block text-base font-medium text-foreground">
                                {slabel}
                              </div>
                              {isRiskTable ? (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {loadingRiskSummary || loadingProjectRisks
                                    ? "Carregando riscos..."
                                    : `${includedRisksCount}/${totalRisksCount} de riscos incluidos`}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              {isRiskTable ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRiskTableExpanded((current) => !current)
                                  }
                                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label={
                                    riskTableExpanded
                                      ? "Recolher riscos"
                                      : "Expandir riscos"
                                  }
                                  aria-expanded={riskTableExpanded}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 transition-transform",
                                      riskTableExpanded
                                        ? "rotate-180"
                                        : "rotate-0",
                                    )}
                                  />
                                </button>
                              ) : null}
                              {isRiskDetails ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRiskDetailsExpanded((current) => !current)
                                  }
                                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label={
                                    riskDetailsExpanded
                                      ? "Recolher detalhamento de riscos"
                                      : "Expandir detalhamento de riscos"
                                  }
                                  aria-expanded={riskDetailsExpanded}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 transition-transform",
                                      riskDetailsExpanded
                                        ? "rotate-180"
                                        : "rotate-0",
                                    )}
                                  />
                                </button>
                              ) : null}
                              <Switch
                                size="default"
                                checked={!!sectionsEnabled[skey]}
                                onCheckedChange={(checked) =>
                                  setSectionsEnabled((current) => ({
                                    ...current,
                                    [skey]: !!checked,
                                  }))
                                }
                                aria-label={`Ativar ${slabel}`}
                              />
                            </div>
                          </div>

                          {isRiskTable && riskTableExpanded ? (
                            <div className="space-y-2 px-3 py-3">
                              {projectRisks.length > 0 ? (
                                projectRisks.map((risk) => (
                                  <label
                                    key={risk.id}
                                    className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                                  >
                                    <span className="min-w-0 flex items-center gap-2 text-foreground">
                                      <Checkbox
                                        checked={!!selectedRiskIds[risk.id]}
                                        onCheckedChange={() =>
                                          toggleProjectRisk(risk.id)
                                        }
                                        className="size-4 rounded border-border text-primary focus:ring-ring"
                                      />
                                      <span className="min-w-0">
                                        <span className="block font-medium">
                                          {risk.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                          {risk.description ||
                                            `Nível ${risk.riskLevel}`}
                                        </span>
                                      </span>
                                    </span>
                                  </label>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  Nenhum risco encontrado para este projeto.
                                 </div>
                              )}
                            </div>
                          ) : null}

                          {isRiskDetails && riskDetailsExpanded ? (
                            <div className="space-y-2 px-3 py-3">
                              {REPORT_SECTIONS.filter(
                                (item) =>
                                  item.key === "assetsArtifacts" ||
                                  item.key === "recommendations",
                              ).map((childSection) => {
                                const childKey = childSection.key;

                                return (
                                  <div
                                    key={childKey}
                                    className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2.5"
                                  >
                                    <div className="min-w-0">
                                      <div className="block text-sm font-medium text-foreground">
                                        {childSection.label}
                                      </div>
                                    </div>

                                    <Switch
                                      size="default"
                                      checked={!!sectionsEnabled[childKey]}
                                      onCheckedChange={(checked) =>
                                        setSectionsEnabled((current) => ({
                                          ...current,
                                          [childKey]: !!checked,
                                        }))
                                      }
                                      aria-label={`Ativar ${childSection.label}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <Separator />

              <div className="justify-between">
                <div>
                  <CardTitle className="text-sm tracking-wider text-muted-foreground">
                    INFORMAÇÕES DO RELATÓRIO
                  </CardTitle>
                </div>
              </div>

              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      className="text-muted-foreground"
                      htmlFor="report-title"
                    >
                      Título
                    </Label>
                    <Input
                      id="report-title"
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Título do relatório"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-muted-foreground"
                      htmlFor="report-client"
                    >
                      Cliente
                    </Label>
                    <Input
                      id="report-client"
                      value={formState.client}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          client: event.target.value,
                        }))
                      }
                      placeholder="Cliente"
                    />
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label
                      className="text-muted-foreground"
                      htmlFor="report-date"
                    >
                      Data
                    </Label>
                    <Popover>
                      <PopoverTrigger
                        id="report-date"
                              className={cn(
                                "w-full inline-flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                                !formState.date && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 size-4" />
                              {formState.date ? (
                                format(
                                  new Date(formState.date + "T12:00:00"),
                                  "dd/MM/yyyy",
                                  { locale: ptBR },
                                )
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formState.date ? new Date(formState.date + "T12:00:00") : undefined}
                          onSelect={(newDate: Date | undefined) =>
                            setFormState((current) => ({
                              ...current,
                              date: newDate ? format(newDate, "yyyy-MM-dd") : "",
                            }))
                          }
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={2025}
                          toYear={2040}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-muted-foreground"
                      htmlFor="report-owner"
                    >
                      Responsável
                    </Label>
                    <Input
                      id="report-owner"
                      value={formState.responsible}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          responsible: event.target.value,
                        }))
                      }
                      placeholder="Responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-muted-foreground"
                      htmlFor="report-summary"
                    >
                      Resumo executivo
                    </Label>
                    <Textarea
                      id="report-summary"
                      value={formState.summary}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          summary: event.target.value,
                        }))
                      }
                      placeholder="Escreva aqui o resumo executivo"
                      className="min-h-32"
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </CardContent>

          <CardFooter className="mt-auto border-t border-border p-5">
            <Button className="w-full" onClick={handleExportHtml}>
              <File />
              Exportar HTML
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex min-h-0 w-full flex-col gap-0 rounded-none border-border bg-white py-0 shadow-sm backdrop-blur lg:h-[calc(100vh-14rem)]">
          <CardHeader className="sticky top-0 z-10 flex min-h-12 items-center border-b border-border px-5 [.border-b]:pb-0 rounded-none bg-card">
            <div className="flex w-full items-left justify-between gap-3">
              <div className="flex items-center gap-3">
                <EyeIcon className="size-5 text-muted-foreground" />
                <CardTitle className="text-sm text-muted-foreground">
                  Preview ao vivo
                </CardTitle>
                <div className="text-primary"> &bull; </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Expandir preview"
                onClick={() => setPreviewExpanded(true)}
                className="text-muted-foreground border-muted-foreground hover:bg-muted/90"
              >
                <Expand className="size-4 text-muted-foreground" />
                Expandir
              </Button>
            </div>
          </CardHeader>
          <CardContent
            ref={previewRef}
            className="min-h-0 flex-1 overflow-y-auto space-y-4 px-5 pb-5 pt-0"
          >
            {previewBody}
          </CardContent>
        </Card>
      </div>

      <Dialog open={previewExpanded} onOpenChange={setPreviewExpanded}>
        <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 bg-white p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-muted-foreground">
              <EyeIcon className="size-5" />
              Preview ao vivo
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 pt-2">
            {previewBody}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}