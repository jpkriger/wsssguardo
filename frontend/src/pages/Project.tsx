import { ReactElement, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { ChevronLeft, FileDown, LoaderCircle } from "lucide-react";
import ArtifactList from "../components/ArtifactList/ArtifactList";
import FindingList from "../components/FindingList/FindingList";
import AssetTable from "../components/AssetTable/AssetTable";
import RiskTable from "../components/RiskTable/RiskTable";
import ProjectSummary from "../components/ProjectSummary/ProjectSummary";
import { ProjectProvider } from "../contexts/ProjectProvider";
import { Button } from "../components/ui/button";
import { projectsById, type ProjectResponse } from "../api/project";
import {
  buildReportRequest,
  downloadReportArtifacts,
  getReportErrorMessage,
  generateReport,
} from "../api/report";
import { toast } from "sonner";

// Status and phase badges removed per design.

export const ProjectTabs = {
  Summary: "Resumo",
  Assets: "Ativos",
  Artifacts: "Artefatos",
  Findings: "Achados",
  Risks: "Riscos",
} as const;

type ProjectTab = (typeof ProjectTabs)[keyof typeof ProjectTabs];

const TABS: ProjectTab[] = [
  ProjectTabs.Summary,
  ProjectTabs.Assets,
  ProjectTabs.Artifacts,
  ProjectTabs.Findings,
  ProjectTabs.Risks,
];

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

export default function Project(): ReactElement {
  const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTabs.Summary);
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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

  async function handleGenerateReport(): Promise<void> {
    if (!project) {
      setExportError("Não foi possível gerar o relatório sem um projeto carregado.");
      return;
    }

    setExportLoading(true);
    setExportError(null);

    try {
      const report = await generateReport(buildReportRequest(project));
      await downloadReportArtifacts(report);
      toast.success("Relatório gerado e arquivos baixados com sucesso.");
    } catch (err: unknown) {
      const message = getReportErrorMessage(err);
      setExportError(message);
      toast.error(message);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <section className="w-full">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Voltar para Dashboard
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
            <span className="text-sm text-muted-foreground">Carregando dados do projeto...</span>
          ) : projectError ? (
            <span className="text-sm text-destructive">{projectError}</span>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loadingProject || !!projectError || !projectId}
          onClick={() => {
            if (projectId) {
              void navigate(`/project/${projectId}/relatorio`);
            }
          }}
        >
          Visualizar relatório
        </Button>
        <Button
          type="button"
          onClick={() => void handleGenerateReport()}
          disabled={loadingProject || !!projectError || !project || exportLoading}
          className="min-w-36"
        >
          {exportLoading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileDown className="size-4" />
              Gerar / Baixar
            </>
          )}
        </Button>
      </div>

      {exportError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {exportError}
        </p>
      )}

      <nav className="mt-8 rounded-full bg-secondary/80 p-1 transition-colors">
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-5">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <li key={tab}>
                <button
                  type="button"
                  className={`w-full rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 min-h-[420px]">
        {activeTab === ProjectTabs.Summary && <ProjectSummary projectId={projectId} />}
        {activeTab === ProjectTabs.Assets && (
          <ProjectProvider projectId={projectId}>
            <AssetTable />
          </ProjectProvider>
        )}
        {activeTab === ProjectTabs.Artifacts && (
          <ArtifactList projectId={projectId} />
        )}
        {activeTab === ProjectTabs.Findings && projectId && (
          <FindingList projectId={projectId} />
        )}
        {activeTab === ProjectTabs.Risks && (
          <ProjectProvider projectId={projectId}>
            <RiskTable />
          </ProjectProvider>
        )}
      </div>
    </section>
  );
}