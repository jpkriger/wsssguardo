import { ReactElement, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import { ChevronLeft, Settings } from "lucide-react";
import ArtifactList from "../components/ArtifactList/ArtifactList";
import AssetTable from "../components/AssetTable/AssetTable";
import RiskModal, {
  type RiskModalOption,
  type RiskModalSubmitData,
} from "../components/RiskModal/RiskModal";
import ProjectSummary from "../components/ProjectSummary/ProjectSummary";
import { ProjectProvider } from "../contexts/ProjectProvider";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { projectsById, type ProjectResponse } from "../api/project";

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

const DEMO_FINDINGS: RiskModalOption[] = [
  { id: "f-1", label: "Achado 01", description: "Falha de segmentação" },
  { id: "f-2", label: "Achado 02", description: "Política de acesso fraca" },
];

const DEMO_ASSETS: RiskModalOption[] = [
  { id: "a-1", label: "Servidor Web", description: "Ativo crítico" },
  { id: "a-2", label: "Banco de Dados", description: "Informações sensíveis" },
];

export default function Project(): ReactElement {
  const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTabs.Summary);
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [riskModalOpen, setRiskModalOpen] = useState(false);

  function handleRiskModalSubmit(_data: RiskModalSubmitData): void {
    setRiskModalOpen(false);
  }

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

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Voltar para Dashboard
      </Link>

      <header className="mt-4 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {project?.name ?? "Projeto"}
          </h1>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">
          {loadingProject
            ? "Carregando dados do projeto..."
            : projectError
              ? projectError
              : `Status: ${project?.status ?? "-"}`}
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Fase atual: Fase 3</Badge>
          <Badge variant="outline">Entrega em 10 dias</Badge>
        </div>
        <Button>Gerar relatório</Button>
      </div>

      <nav className="mt-8 rounded-full bg-secondary/80 p-1 transition-colors">
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-5">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <li key={tab}>
                <button
                  type="button"
                  className={`w-full rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
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
        {activeTab === ProjectTabs.Summary && <ProjectSummary />}
        {activeTab === ProjectTabs.Assets && (
          <ProjectProvider projectId={projectId}>
            <AssetTable />
          </ProjectProvider>
        )}
        {activeTab === ProjectTabs.Artifacts && (
          <ArtifactList projectId={projectId} />
        )}
        {activeTab === ProjectTabs.Findings && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-normal text-foreground leading-tight">
                  Achados
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Área reservada para os achados vinculados ao projeto.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setRiskModalOpen(true)}>
                Abrir modal de risco
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Use a aba de riscos para visualizar o modal novo diretamente no localhost.
            </p>
          </div>
        )}
        {activeTab === ProjectTabs.Risks && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-normal text-foreground leading-tight">
                  Riscos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Abra o modal para conferir o layout, os vínculos e a validação.
                </p>
              </div>
              <Button type="button" onClick={() => setRiskModalOpen(true)}>
                Novo risco
              </Button>
            </div>

            <div className="mt-6 grid gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>O cadastro de risco ainda não está conectado ao backend.</p>
              <p>Este botão abre a modal com dados de demonstração para você validar a interface.</p>
            </div>
          </div>
        )}
      </div>

      <RiskModal
        open={riskModalOpen}
        loading={false}
        mode="create"
        findings={DEMO_FINDINGS}
        assets={DEMO_ASSETS}
        onClose={() => setRiskModalOpen(false)}
        onSubmit={handleRiskModalSubmit}
      />
    </section>
  );
}
