import type { ReactElement } from "react";
import { CalendarClock, Files, FolderOpen, ScanSearch, ShieldAlert, TriangleAlert } from "lucide-react";
import ProjectHomeInfoCardNumeric from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardNumeric";
import ProjectHomeInfoCardNotification from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardNotification";

interface ProjectSummaryProps {
  assetCount?: number;
  artifactCount?: number;
  findingCount?: number;
  riskCount?: number;
  highRisks?: number;
  mediumRisks?: number;
  lowRisks?: number;
  deadlineDate?: string;
  daysRemaining?: number;
}

export default function ProjectSummary({
  assetCount = 2,
  artifactCount = 2,
  findingCount = 2,
  riskCount = 2,
  highRisks = 1,
  mediumRisks = 1,
  lowRisks = 0,
  deadlineDate = "06/04/2026",
  daysRemaining = 10,
}: ProjectSummaryProps): ReactElement {
  const showDeadlineAlert = daysRemaining <= 14;
  const showCriticalAlert = highRisks > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Ativos registrados" value={assetCount} icon={<FolderOpen className="size-5 text-muted-foreground" />} />
        <StatCard title="Artefatos coletados" value={artifactCount} icon={<Files className="size-5 text-muted-foreground" />} />
        <StatCard title="Achados identificados" value={findingCount} icon={<ScanSearch className="size-5 text-muted-foreground" />} />
        <StatCard title="Riscos calculados" value={riskCount} icon={<ShieldAlert className="size-5 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProjectHomeInfoCardNumeric title="Riscos altos" data={highRisks} accent="red" />
        <ProjectHomeInfoCardNumeric title="Riscos médios" data={mediumRisks} accent="yellow" />
        <ProjectHomeInfoCardNumeric title="Riscos baixos" data={lowRisks} accent="green" />
      </div>

      {(showDeadlineAlert || showCriticalAlert) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {showDeadlineAlert && (
            <ProjectHomeInfoCardNotification
              icon={<CalendarClock className="size-4" />}
              title="Atenção a prazo"
              description={`Entrega em ${deadlineDate}. Restam ${daysRemaining} dias para conclusão.`}
              accent="yellow"
            />
          )}
          {showCriticalAlert && (
            <ProjectHomeInfoCardNotification
              icon={<TriangleAlert className="size-4" />}
              title="Ponto crítico"
              description={`Existem ${highRisks} risco${highRisks > 1 ? "s" : ""} alto${highRisks > 1 ? "s" : ""} em aberto. Recomenda-se revisar rapidamente os riscos da seção correspondente.`}
              accent="red"
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactElement;
}): ReactElement {
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
