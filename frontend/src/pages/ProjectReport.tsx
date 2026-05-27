import { ReactElement, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  CalendarClock,
  ChevronLeft,
  FileText,
  LayoutGrid,
  ListFilter,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { buttonVariants } from "../components/ui/button";
import { projectsById, type ProjectResponse } from "../api/project";
import { getRiskSummary, type RiskSummaryResponse } from "../api/risk";
import { cn } from "../lib/utils";

const DETAIL_LEVELS = [
  { value: "executive", label: "Executivo", description: "Resumo curto e visual" },
  { value: "balanced", label: "Equilibrado", description: "Concilia síntese e detalhe" },
  { value: "detailed", label: "Detalhado", description: "Inclui todas as seções" },
] as const;

const REPORT_SECTIONS = [
  { key: "summary", label: "Resumo executivo", description: "Visão geral para a abertura do relatório" },
  { key: "assets", label: "Ativos", description: "Inventário e vínculos do projeto" },
  { key: "artifacts", label: "Artefatos", description: "Evidências e documentos coletados" },
  { key: "findings", label: "Achados", description: "Pontos identificados na análise" },
  { key: "risks", label: "Riscos", description: "Riscos priorizados para a saída final" },
] as const;

const RISK_FILTERS = [
  { key: "high", label: "Alto" },
  { key: "medium", label: "Médio" },
  { key: "low", label: "Baixo" },
] as const;

type DetailLevel = (typeof DETAIL_LEVELS)[number]["value"];
type ReportSectionKey = (typeof REPORT_SECTIONS)[number]["key"];
type RiskFilterKey = (typeof RISK_FILTERS)[number]["key"];

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

function formatDate(date: string | null): string {
  if (!date) return "Sem data definida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function buildInitialFormState(project: ProjectResponse | null): FormState {
  return {
    title: project?.name ?? "",
    client: project?.customerId ?? "",
    date: getTodayIsoDate(),
    responsible: "Equipe de análise",
    summary: project ? `Resumo executivo do projeto ${project.name}.` : "",
  };
}

function buildSectionState(): Record<ReportSectionKey, boolean> {
  return {
    summary: true,
    assets: true,
    artifacts: true,
    findings: true,
    risks: true,
  };
}

function buildRiskState(): Record<RiskFilterKey, boolean> {
  return {
    high: true,
    medium: true,
    low: true,
  };
}

export default function ProjectReport(): ReactElement {
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [riskSummary, setRiskSummary] = useState<RiskSummaryResponse | null>(null);
  const [loadingRiskSummary, setLoadingRiskSummary] = useState(true);
  const [reportLevel, setReportLevel] = useState<DetailLevel>("balanced");
  const [formState, setFormState] = useState<FormState>(() => buildInitialFormState(null));
  const [sectionsEnabled, setSectionsEnabled] = useState<Record<ReportSectionKey, boolean>>(() => buildSectionState());
  const [riskFilters, setRiskFilters] = useState<Record<RiskFilterKey, boolean>>(() => buildRiskState());

  useEffect(() => {
    setFormState(buildInitialFormState(project));
  }, [project]);

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
        const message = err instanceof Error ? err.message : "Erro ao carregar projeto";
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

  const activeSections = REPORT_SECTIONS.filter((section) => sectionsEnabled[section.key]);
  const activeRisks = RISK_FILTERS.filter((risk) => riskFilters[risk.key]);
  const selectedDetailLabel = DETAIL_LEVELS.find((level) => level.value === reportLevel)?.label ?? "Equilibrado";

  function toggleSection(sectionKey: ReportSectionKey): void {
    setSectionsEnabled((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  function toggleRiskFilter(riskKey: RiskFilterKey): void {
    setRiskFilters((current) => ({
      ...current,
      [riskKey]: !current[riskKey],
    }));
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-6 lg:-mx-40 lg:w-[calc(100%+20rem)] lg:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={projectId ? `/project/${projectId}` : "/projects"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para o projeto
        </Link>
      </div>

      <div className="grid flex-1 min-h-0 gap-0 lg:grid-cols-[40%_60%] lg:items-stretch">
        <aside className="flex min-h-0 w-full flex-col border border-border bg-card/80 shadow-sm backdrop-blur lg:h-[calc(100vh-14rem)]">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Painel de composição</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure o escopo e os campos do relatório antes de gerar a saída.
              </p>
            </div>
            <MapPinned className="size-5 text-primary" />
          </div>

          <div className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
            <span>{loadingProject ? "Carregando dados do projeto..." : projectError ?? ""}</span>
            {project?.name ? <span className="ml-3 text-foreground">{project.name}</span> : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <div className="border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Nível de detalhe</h3>
                    <p className="text-sm text-muted-foreground">Escolha a profundidade do conteúdo.</p>
                  </div>
                  <ListFilter className="size-4 text-primary" />
                </div>
                <select
                  value={reportLevel}
                  onChange={(event) => setReportLevel(event.target.value as DetailLevel)}
                  className="mt-4 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {DETAIL_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {DETAIL_LEVELS.find((level) => level.value === reportLevel)?.description}
                </p>
              </div>

              <div className="border border-border bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LayoutGrid className="size-4 text-primary" />
                  Seções do relatório
                </div>
                <div className="mt-4 space-y-3">
                  {REPORT_SECTIONS.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      aria-pressed={sectionsEnabled[section.key]}
                      onClick={() => toggleSection(section.key)}
                      className={cn(
                        "flex w-full items-start gap-3 border px-3 py-3 text-left transition-colors",
                        sectionsEnabled[section.key]
                          ? "border-primary/30 bg-primary/8"
                          : "border-border bg-background hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                          sectionsEnabled[section.key]
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-transparent",
                        )}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{section.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{section.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-border bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Filtros por risco
                </div>
                <div className="mt-4 space-y-2">
                  {RISK_FILTERS.map((risk) => {
                    const count =
                      risk.key === "high"
                        ? riskSummary?.highRisks ?? 0
                        : risk.key === "medium"
                          ? riskSummary?.mediumRisks ?? 0
                          : riskSummary?.lowRisks ?? 0;

                    return (
                      <label
                        key={risk.key}
                        className={cn(
                          "flex cursor-pointer items-center justify-between border px-3 py-2 text-sm transition-colors",
                          riskFilters[risk.key]
                            ? "border-primary/30 bg-primary/8"
                            : "border-border bg-background hover:bg-muted/40",
                        )}
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          <input
                            type="checkbox"
                            checked={riskFilters[risk.key]}
                            onChange={() => toggleRiskFilter(risk.key)}
                            className="size-4 rounded border-border text-primary focus:ring-ring"
                          />
                          <span>{risk.label}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {loadingRiskSummary ? "..." : `${count} itens`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border border-border bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="size-4 text-primary" />
                  Campos editáveis
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-title">Título</Label>
                    <Input
                      id="report-title"
                      value={formState.title}
                      onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Título do relatório"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-client">Cliente</Label>
                    <Input
                      id="report-client"
                      value={formState.client}
                      onChange={(event) => setFormState((current) => ({ ...current, client: event.target.value }))}
                      placeholder="Cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-date">Data</Label>
                    <Input
                      id="report-date"
                      type="date"
                      value={formState.date}
                      onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-owner">Responsável</Label>
                    <Input
                      id="report-owner"
                      value={formState.responsible}
                      onChange={(event) => setFormState((current) => ({ ...current, responsible: event.target.value }))}
                      placeholder="Responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-summary">Resumo executivo</Label>
                    <Textarea
                      id="report-summary"
                      value={formState.summary}
                      onChange={(event) => setFormState((current) => ({ ...current, summary: event.target.value }))}
                      placeholder="Escreva aqui o resumo executivo"
                      className="min-h-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border p-5">
            <div className="grid w-full grid-cols-2 gap-2">
              <button type="button" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Exportar HTML
              </button>
              <button type="button" className={buttonVariants({ variant: "default", className: "w-full" })}>
                Exportar PDF
              </button>
            </div>
          </div>
        </aside>

        <section className="min-h-0 w-full border border-border bg-card/70 p-5 shadow-sm backdrop-blur lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
          <div className="flex min-h-full flex-col gap-5">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">preview ao vivo</h2>
              </div>
              <button type="button" className={buttonVariants({ variant: "outline" })} aria-label="Expandir preview">
                <span className="text-sm font-medium">Expandir</span>
              </button>
            </div>

            <div className="min-h-0 flex-1" />
          </div>
        </section>
      </div>
    </section>
  );
}