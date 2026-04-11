import { ReactElement, useMemo, useState } from "react";

type ProjectTab = "Resumo" | "Ativo" | "Artefatos" | "Achados" | "Riscos";

const TABS: ProjectTab[] = ["Resumo", "Ativo", "Artefatos", "Achados", "Riscos"];

export default function Project(): ReactElement {
  const [activeTab, setActiveTab] = useState<ProjectTab>("Resumo");

  const tabDescription = useMemo(() => {
    if (activeTab === "Resumo") {
      return "Visao geral do projeto e indicadores principais.";
    }
    return `Conteudo da aba ${activeTab.toLowerCase()} sera integrado nesta area.`;
  }, [activeTab]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Projeto PRJ-001</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Breve descricao do projeto aqui.</p>
      </header>

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
        <p className="sr-only">{tabDescription}</p>
      </div>
    </section>
  );
}
