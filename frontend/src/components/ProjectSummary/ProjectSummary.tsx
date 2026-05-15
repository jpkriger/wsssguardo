import { useEffect, useState, type ReactElement } from "react";
import { CalendarClock, Files, FolderOpen, ScanSearch, ShieldAlert, TriangleAlert } from "lucide-react";
import ProjectHomeInfoCardNumeric from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardNumeric";
import ProjectHomeInfoCardNotification from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardNotification";
import { getProjectSummary, type ProjectSummaryDTO } from "@/api/project";

interface ProjectSummaryProps {
  projectId?: string;
}

export default function ProjectSummary({ projectId }: ProjectSummaryProps): ReactElement {
  const [summary, setSummary] = useState<ProjectSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getProjectSummary(projectId)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar resumo");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando resumo...</p>;
  }

  if (error || !summary) {
    return <p className="text-sm text-destructive">{error ?? "Resumo indisponível."}</p>;
  }

  const deadlineLabel = summary.deadlineDate
    ? new Date(summary.deadlineDate).toLocaleDateString("pt-BR")
    : null;
  const showDeadlineAlert = summary.daysRemaining != null && summary.daysRemaining <= 14;
  const showCriticalAlert = summary.highRisks > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Ativos registrados"    value={summary.assetCount}    icon={<FolderOpen  className="size-5 text-muted-foreground" />} />
        <StatCard title="Artefatos coletados"   value={summary.artifactCount} icon={<Files       className="size-5 text-muted-foreground" />} />
        <StatCard title="Achados identificados" value={summary.findingCount}  icon={<ScanSearch  className="size-5 text-muted-foreground" />} />
        <StatCard title="Riscos calculados"     value={summary.riskCount}     icon={<ShieldAlert className="size-5 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProjectHomeInfoCardNumeric title="Riscos altos"   data={summary.highRisks}   accent="red"    />
        <ProjectHomeInfoCardNumeric title="Riscos médios"  data={summary.mediumRisks} accent="yellow" />
        <ProjectHomeInfoCardNumeric title="Riscos baixos"  data={summary.lowRisks}    accent="green"  />
      </div>

      {(showDeadlineAlert || showCriticalAlert) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showDeadlineAlert && deadlineLabel && (
            <ProjectHomeInfoCardNotification
              icon={<CalendarClock className="size-4" />}
              title="Atenção a prazo"
              description={`Entrega em ${deadlineLabel}. Restam ${summary.daysRemaining ?? 0} dias para conclusão.`}
              accent="yellow"
            />
          )}
          {showCriticalAlert && (
            <ProjectHomeInfoCardNotification
              icon={<TriangleAlert className="size-4" />}
              title="Ponto crítico"
              description={`Existem ${summary.highRisks} risco${summary.highRisks > 1 ? "s" : ""} alto${summary.highRisks > 1 ? "s" : ""} em aberto. Recomenda-se revisar rapidamente os riscos da seção correspondente.`}
              accent="red"
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactElement }): ReactElement {
  return (
    <div className="rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className="mt-3 text-4xl font-semibold text-card-foreground">{value}</div>
    </div>
  );
}
