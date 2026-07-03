import { useMemo, type ReactElement } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";

// Types

export type RiskLevel = "alto" | "medio" | "baixo";

export interface ProjectRisk {
  level: RiskLevel;
  count: number;
}

export type ProjectApiStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED"
  | "ARCHIVED";

const STATUS_FALLBACK = {
  label: "Desconhecido",
  className: "bg-muted/60 text-muted-foreground border-border",
};

const STATUS_LABEL: Record<Exclude<ProjectApiStatus, "IN_PROGRESS">, { label: string; className: string }> = {
  COMPLETED: {
    label: "Concluído",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  },
  ON_HOLD: {
    label: "Em espera",
    className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30 dark:text-yellow-400",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-muted/60 text-muted-foreground border-border",
  },
  ARCHIVED: {
    label: "Arquivado",
    className: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400",
  },
};

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectApiStatus;
  endDate: string | null;
  daysRemaining: number;
  totalDays: number;
  consultants: {
    name: string;
    avatarUrl?: string;
  }[];
  risks: ProjectRisk[];
}

// Helpers

function getInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((n) => n.trim())
    .filter(Boolean);

  return (parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  alto: {
    label: "Alto",
    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  medio: {
    label: "Médio",
    className: "bg-warning text-warning-foreground hover:bg-warning/90",
  },
  baixo: {
    label: "Baixo",
    className: "bg-success text-success-foreground hover:bg-success/90",
  },
};

// Sub-components

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }): ReactElement {
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted border border-border"
      title={name}
      aria-label={name}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] font-bold text-muted-foreground">{getInitials(name)}</span>
      )}
    </div>
  );
}

function getConsultantNames(project: Project): string {
  return project.consultants.map((consultant) => consultant.name).join(", ") || "Sem consultor";
}

function ConsultantWarning(): ReactElement {
  return (
    <Badge
      variant="outline"
      className="h-8 w-8 rounded-full p-0 flex items-center justify-center border-red-300/40 bg-red-500/10 text-red-600 dark:text-red-400"
      title="Sem consultor atribuído"
      aria-label="Sem consultor atribuído"
    >
      !
    </Badge>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }): ReactElement {
  const pct = Math.min(100, Math.round(((total - value) / total) * 100));
  return (
    <div className="flex flex-col gap-1 w-40">
      {/* Track: color-mix(in srgb, var(--color-primary) 20%, transparent) → via inline style */}
      <div
        className="rounded-full h-[6px] w-full overflow-hidden"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[400ms] ease-in-out"
          style={{ width: `${pct}%`, backgroundColor: "#A17B4D" }}
        />
      </div>
      <span className="!text-[14px] text-muted-foreground">Restam {value} dias</span>
    </div>
  );
}

function RiskBadges({ risks }: { risks: Project["risks"] }): ReactElement {
  const hasThreeRisks = risks.length === 3;

  return (
    <div className="@container w-fit">
      <div
        className={cn(
          "grid gap-[6px] w-fit",
          hasThreeRisks
            ? 
              "grid-cols-[repeat(2,max-content)] @[130px]:grid-cols-1"
            :
              "grid-cols-[repeat(2,max-content)]",
        )}
      >
        {risks.map((risk, index) => {
          const cfg = riskConfig[risk.level];
          const isThird = hasThreeRisks && index === 2;

          return (
            <Badge
              key={risk.level}
              className={cn(
                "!w-[55px] !h-[24px] flex items-center justify-center !text-[12px] !rounded-[6px] whitespace-nowrap px-2",
                isThird && "col-span-full justify-self-center @[130px]:col-auto @[130px]:justify-self-start",
                cfg.className,
              )}
            >
              {risk.count} {cfg.label}{risk.count !== 1 ? "s" : ""}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

// Main

const PAGE_SIZE = 5;

interface ProjectsTableProps {
  projects: Project[];
  totalCount: number;
}

export function ProjectsTable({ projects, totalCount }: ProjectsTableProps): ReactElement {
  const navigate = useNavigate();

  const columns: ColumnDefinition<Project>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Projeto",
        isRequired: true,
        getSortValue: (p) => `${p.name} ${p.code}`,
        renderCell: (p) => (
          <div>
            <p className="!text-[18px] font-semibold text-foreground">{p.name}</p>
            <p className="!text-[12px] text-muted-foreground mt-0.5">{p.code}</p>
          </div>
        ),
      },
      {
        id: "daysRemaining",
        label: "Tempo restante",
        getSortValue: (p) => p.daysRemaining,
        renderCell: (p) => {
          if (p.status !== "IN_PROGRESS") {
            const statusInfo = STATUS_LABEL[p.status] ?? STATUS_FALLBACK;
            return (
              <Badge variant="outline" className={cn("text-xs font-medium", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
            );
          }
          if (p.endDate === null) {
            return <span className="!text-[14px] text-muted-foreground">Sem prazo definido</span>;
          }
          if (p.daysRemaining === 0) {
            return (
              <div className="flex flex-col gap-1 w-40">
                <div
                  className="rounded-full h-[6px] w-full overflow-hidden"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-[400ms] ease-in-out"
                    style={{ width: "100%", backgroundColor: "#A17B4D" }}
                  />
                </div>
                <span className="!text-[14px] text-muted-foreground">Prazo encerrado</span>
              </div>
            );
          }
          return <ProgressBar value={p.daysRemaining} total={p.totalDays} />;
        },
      },
      {
        id: "consultant",
        label: "Consultor",
        getSortValue: getConsultantNames,
        renderCell: (p) => {
          if (p.consultants.length === 0) return <ConsultantWarning />;

          return (
            <div className="flex items-center -space-x-2">
              {p.consultants.map((consultant, index) => (
                <Avatar
                  key={`${consultant.name}-${index}`}
                  name={consultant.name}
                  avatarUrl={consultant.avatarUrl}
                />
              ))}
            </div>
          );
        },
      },
      {
        id: "risks",
        label: "Riscos",
        cellClassName: "@container",
        renderCell: (p) => <RiskBadges risks={p.risks} />,
      },
      {
        id: "action",
        label: "Ação",
        isRequired: true,
        headClassName: "text-right",
        cellClassName: "text-right",
        renderCell: (p) => (
          <Button
            variant="ghost"
            size="sm"
            className="!text-[16px] gap-1"
            onClick={(e) => {
              e.stopPropagation();
              void navigate(`/project/${p.id}`);
            }}
          >
            Acessar <ChevronRight className="h-[18px] w-[18px]" />
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <GenericTable
      tableId="projects-table"
      data={projects}
      columns={columns}
      clientPagination
      clientSearch
      pageSize={PAGE_SIZE}
      title="Projetos"
      subtitle={`${totalCount} auditorias registradas`}
      onRowClick={(p) => void navigate(`/project/${p.id}`)}
      filters={[
        {
          id: "consultant",
          label: "Consultor",
          type: "select",
          getValue: getConsultantNames,
        },
      ]}
      emptyMessage="Nenhum projeto encontrado."
    />
  );
}