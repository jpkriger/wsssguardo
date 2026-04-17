import { ReactElement, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import { ChevronLeft, Settings } from "lucide-react";
import ArtifactList from "../components/ArtifactList/ArtifactList";
import AssetTable from "../components/AssetTable/AssetTable";
import ProjectSummary from "../components/ProjectSummary/ProjectSummary";
import { ProjectProvider } from "../contexts/ProjectProvider";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export const ProjectTabs = {
  Summary: "Resumo",
  Assets: "Ativos",
  Artifacts: "Artefatos",
  Findings: "Achados",
  Risks: "Riscos",
} as const;

type ProjectTab = typeof ProjectTabs[keyof typeof ProjectTabs];

const TABS: ProjectTab[] = [
  ProjectTabs.Summary,
  ProjectTabs.Assets,
  ProjectTabs.Artifacts,
  ProjectTabs.Findings,
  ProjectTabs.Risks,
];

export default function Project(): ReactElement {
  const [activeTab, setActiveTab] = useState<ProjectTab>(ProjectTabs.Summary);
  const { id: projectId } = useParams<{ id: string }>();

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Projeto PRJ-001</h1>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">
          Revisão de acessos privilegiados e hardening de endpoints do financeiro.
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
      </div>
    </section>
  );
}
