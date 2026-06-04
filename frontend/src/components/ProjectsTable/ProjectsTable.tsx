import { useMemo, type ReactElement } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import styles from "./ProjectsTable.module.css";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";

// Types

export type RiskLevel = "alto" | "medio" | "baixo";

export interface ProjectRisk {
  level: RiskLevel;
  count: number;
}

export type ProjectApiStatus = "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

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
};

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectApiStatus;
  endDate: string | null;
  daysRemaining: number;
  totalDays: number;
  consultant: {
    name: string;
    avatarUrl?: string;
  };
  risks: ProjectRisk[];
}

// Helpers

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
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
    <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted border border-border">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] font-bold text-muted-foreground">{getInitials(name)}</span>
      )}
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }): ReactElement {
  const pct = Math.min(100, Math.round(((total - value) / total) * 100));
  return (
    <div className="flex flex-col gap-1 w-40">
      <div className={styles["progress-track"]}>
        <div className={styles["progress-bar"]} style={{ width: `${pct}%` }} />
      </div>
      <span className="!text-[14px] text-muted-foreground">Restam {value} dias</span>
    </div>
  );
}

function RiskBadges({ risks }: { risks: Project["risks"] }): ReactElement {
  const hasThreeRisks = risks.length === 3;
  return (
    <div className={cn(styles["risk-badges"], hasThreeRisks && styles["risk-badges--three"])}>
      {risks.map((risk) => {
        const cfg = riskConfig[risk.level];
        return (
          <Badge
            key={risk.level}
            className={cn(
              "!w-[55px] !h-[24px] flex items-center justify-center !text-[12px] !rounded-[6px] whitespace-nowrap px-2",
              cfg.className,
            )}
          >
            {risk.count} {cfg.label}{risk.count !== 1 ? "s" : ""}
          </Badge>
        );
      })}
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
        // Include code in getSortValue so clientSearch matches both name and code
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
            return (
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", STATUS_LABEL[p.status].className)}
              >
                {STATUS_LABEL[p.status].label}
              </Badge>
            );
          }
          if (p.endDate === null) {
            return <span className="!text-[14px] text-muted-foreground">Sem prazo definido</span>;
          }
          if (p.daysRemaining === 0) {
            return (
              <div className="flex flex-col gap-1 w-40">
                <div className={styles["progress-track"]}>
                  <div className={styles["progress-bar"]} style={{ width: "100%" }} />
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
        getSortValue: (p) => p.consultant.name,
        renderCell: (p) => (
          <div className="flex items-center gap-2">
            <Avatar name={p.consultant.name} avatarUrl={p.consultant.avatarUrl} />
            <span className="!text-[18px] text-foreground">{p.consultant.name}</span>
          </div>
        ),
      },
      {
        id: "risks",
        label: "Riscos",
        cellClassName: styles["risk-cell"],
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
          getValue: (p) => p.consultant.name,
        },
      ]}
      emptyMessage="Nenhum projeto encontrado."
    />
  );
}
