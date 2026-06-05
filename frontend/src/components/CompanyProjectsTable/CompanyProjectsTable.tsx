import { useMemo, type ReactElement } from "react";
import { useNavigate } from "react-router";
// ArrowRight
import { Plus, FolderOpen, Pencil, Trash2, CheckCheck, XCircle, ArrowRight } from "lucide-react";
import type { ProjectStatus as ApiProjectStatus } from "@/api/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";

export type ProjectStatus = "Em andamento" | "Atrasado" | "Concluído" | "Em espera" | "Cancelado";

export interface CompanyProject {
  id: string;
  name: string;
  /** Display string (dd/mm/yyyy) */
  startDate: string;
  /** Display string (dd/mm/yyyy) */
  endDate: string;
  /** Raw ISO date for correct sorting/filtering */
  startDateRaw: string | null;
  /** Raw ISO date for correct sorting/filtering */
  endDateRaw: string | null;
  status: ProjectStatus;
  rawStatus: ApiProjectStatus;
}

const statusConfig: Record<ProjectStatus, { className: string }> = {
  "Em andamento": {
    className: "bg-blue-500/10 text-blue-400 border border-blue-500/50 px-2.5 py-0.5 rounded-sm font-medium",
  },
  Atrasado: {
    className: "bg-red-500/10 text-red-400 border border-red-500/50 px-2.5 py-0.5 rounded-sm font-medium",
  },
  "Concluído": {
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/60 px-2.5 py-0.5 rounded-sm font-medium",
  },
  "Em espera": {
    className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 px-2.5 py-0.5 rounded-sm font-medium",
  },
  "Cancelado": {
    className: "bg-muted/50 text-muted-foreground border border-border px-2.5 py-0.5 rounded-sm font-medium",
  },
};

interface CompanyProjectsTableProps {
  projects: CompanyProject[];
  onCreateProject?: () => void;
  onEditProject?: (id: string) => void;
  onDeleteProject?: (id: string, name: string) => void;
  onCompleteProject?: (id: string) => void;
  onCancelProject?: (id: string) => void;
  cardClassName?: string;
}

export function CompanyProjectsTable({
  projects,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCompleteProject,
  onCancelProject,
  cardClassName = "mx-5 mt-4 mb-4 ml-16",
}: CompanyProjectsTableProps): ReactElement {
  const navigate = useNavigate();
  const columns: ColumnDefinition<CompanyProject>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nome do Projeto",
        isRequired: true,
        getSortValue: (p) => p.name,
        renderCell: (p) => (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 text-brand flex-shrink-0" />
            <span className="text-[13px] text-foreground">{p.name}</span>
          </div>
        ),
      },
      {
        id: "startDate",
        label: "Data Início",
        getSortValue: (p) => p.startDateRaw,
        renderCell: (p) => (
          <span className="text-[13px] text-muted-foreground">{p.startDate}</span>
        ),
      },
      {
        id: "endDate",
        label: "Data Término",
        getSortValue: (p) => p.endDateRaw,
        renderCell: (p) => (
          <span className="text-[13px] text-muted-foreground">{p.endDate}</span>
        ),
      },
      {
        id: "status",
        label: "Status",
        getSortValue: (p) => p.status,
        renderCell: (p) => (
          <Badge className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", statusConfig[p.status].className)}>
            {p.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        label: "Ações",
        isRequired: true,
        width: "200px",
        headClassName: "text-center justify-center w-70",
        cellClassName: "text-center justify-center w-70",
        renderCell: (p) => (
          <div className="flex gap-1 relative right-3">
            {p.rawStatus !== "COMPLETED" && p.rawStatus !== "CANCELLED" && (
              <>
                <button
                  type="button"
                  className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Ir para o projeto"
                  onClick={(e) => { e.stopPropagation(); void navigate(`/project/${p.id}`); }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Concluir projeto"
                  onClick={(e) => { e.stopPropagation(); onCompleteProject?.(p.id); }}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Cancelar projeto"
                  onClick={(e) => { e.stopPropagation(); onCancelProject?.(p.id); }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Editar projeto"
              onClick={(e) => { e.stopPropagation(); onEditProject?.(p.id); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Excluir projeto"
              onClick={(e) => { e.stopPropagation(); onDeleteProject?.(p.id, p.name); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onCompleteProject, onCancelProject, onEditProject, onDeleteProject, navigate],
  );

  return (
    <GenericTable
      tableId="company-projects"
      data={projects}
      columns={columns}
      clientPagination
      pageSize={5}
      title="Projetos da Empresa"
      primaryAction={
        onCreateProject
          ? { label: "Criar Projeto", icon: Plus, onClick: onCreateProject }
          : undefined
      }
      emptyMessage="Nenhum projeto cadastrado."
      cardClassName={cardClassName}
      enableSearch={false}
    />
  );
}
