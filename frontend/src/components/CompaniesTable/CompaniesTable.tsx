import { useMemo, type ReactElement } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";
import {
  CompanyProjectsTable,
  type CompanyProject,
} from "../CompanyProjectsTable/CompanyProjectsTable";

// Types

export interface Company {
  id: string;
  name: string;
  totalProjects: number;
  /** Display string (dd/mm/yyyy) */
  createdAt: string;
  /** Raw ISO date for correct sorting/filtering */
  createdAtRaw: string;
  projects: CompanyProject[];
}

// Props

interface CompaniesTableProps {
  companies: Company[];
  search: string;
  onSearchChange?: (v: string) => void;
  onEditCompany?: (id: string) => void;
  onDeleteCompany?: (id: string, name: string) => void;
  onCreateProject?: (companyId: string, companyName: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string, projectName: string) => void;
  onCompleteProject?: (projectId: string) => void;
  onCancelProject?: (projectId: string) => void;
}

const PAGE_SIZE = 4;

// Component

export function CompaniesTable({
  companies,
  search,
  onEditCompany,
  onDeleteCompany,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCompleteProject,
  onCancelProject,
}: CompaniesTableProps): ReactElement {
  const filtered = useMemo(
    () =>
      search.trim()
        ? companies.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase()),
          )
        : companies,
    [companies, search],
  );

  const columns: ColumnDefinition<Company>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nome da Empresa",
        isRequired: true,
        getSortValue: (c) => c.name,
        renderCell: (c) => (
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-brand flex-shrink-0" />
            <span className="text-[14px] font-medium text-foreground">{c.name}</span>
          </div>
        ),
      },
      {
        id: "totalProjects",
        label: "Total de Projetos",
        headClassName: "text-center",
        cellClassName: "text-center",
        getSortValue: (c) => c.totalProjects,
        renderCell: (c) => (
          <span className="text-[14px] text-foreground font-medium">{c.totalProjects}</span>
        ),
      },
      {
        id: "createdAt",
        label: "Data de Criação",
        getSortValue: (c) => c.createdAtRaw,
        renderCell: (c) => (
          <span className="text-[13px] text-muted-foreground">{c.createdAt}</span>
        ),
      },
      {
        id: "actions",
        label: "Ações",
        isRequired: true,
        headClassName: "text-right",
        cellClassName: "text-right",
        renderCell: (c) => (
          <div className={cn("flex items-center justify-end gap-1")}>
            <button
              type="button"
              className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Editar empresa"
              onClick={(e) => { e.stopPropagation(); onEditCompany?.(c.id); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="h-7 w-7 p-0 flex items-center justify-center rounded bg-transparent border-none cursor-pointer text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Excluir empresa"
              onClick={(e) => { e.stopPropagation(); onDeleteCompany?.(c.id, c.name); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onEditCompany, onDeleteCompany],
  );

  return (
    <GenericTable
      tableId="companies-table"
      data={filtered}
      columns={columns}
      clientPagination
      pageSize={PAGE_SIZE}
      enableSearch={false}
      filters={[
        {
          id: "createdAt",
          label: "Data de criação",
          type: "dateRange",
          getValue: (c) => c.createdAtRaw,
        },
      ]}
      emptyMessage="Nenhuma empresa encontrada."
      expandableContent={(company) => (
        <CompanyProjectsTable
          projects={company.projects}
          cardClassName="generic-table-card--nested"
          onCreateProject={() => onCreateProject?.(company.id, company.name)}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onCompleteProject={onCompleteProject}
          onCancelProject={onCancelProject}
        />
      )}
    />
  );
}
