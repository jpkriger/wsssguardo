import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CompanyProjectsTable,
  type CompanyProject,
} from "../CompanyProjectsTable/CompanyProjectsTable";

// Types 

export interface Company {
  id: string;
  name: string;
  totalProjects: number;
  createdAt: string;
  projects: CompanyProject[];
}

// Pagination 

const PAGE_SIZE = 4;

function Pagination({
  total,
  page,
  onPage,
}: {
  total: number;
  page: number;
  onPage: (p: number) => void;
}): React.JSX.Element | null {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3);
    if (page > 4) pages.push("...");
    if (page > 3 && page < totalPages - 1) pages.push(page);
    pages.push("...", totalPages - 1, totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="text-xs text-muted-foreground px-1"
          >
            ···
          </span>
        ) : (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              page === p
                ? "border-2 border-foreground"
                : "border border-transparent",
            )}
            onClick={() => onPage(p)}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-0.5"
      >
        Próximo <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Props 

interface CompaniesTableProps {
  companies: Company[];
  search: string;
  onSearchChange: (v: string) => void;
  onEditCompany?: (id: string) => void;
  onDeleteCompany?: (id: string) => void;
  onCreateProject?: (companyId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

// Component 

export function CompaniesTable({
  companies,
  search,
  onEditCompany,
  onDeleteCompany,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: CompaniesTableProps): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      companies.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [companies, search],
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  const toggle = (id: string): void =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="w-10 px-4" />
            {[
              { label: "Nome da Empresa", align: "left" },
              { label: "Total de Projetos", align: "center" },
              { label: "Data de Criação", align: "left" },
              { label: "Ações", align: "right" },
            ].map(({ label, align }) => (
              <TableHead
                key={label}
                className={cn(
                  "text-[11px] uppercase tracking-widest font-semibold px-4 py-3 text-muted-foreground",
                  align === "center" && "text-center",
                  align === "right" && "text-right",
                )}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-14 text-muted-foreground text-[13px]"
              >
                Nenhuma empresa encontrada.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((company) => {
              const isExpanded = expandedId === company.id;

              return (
                <>
                  <TableRow
                    key={company.id}
                    className={cn(
                      "border-b border-border transition-colors cursor-pointer select-none",
                      isExpanded ? "bg-muted/30" : "hover:bg-muted/20",
                    )}
                    onClick={() => toggle(company.id)}
                  >
                    <TableCell className="w-10 px-4 py-4">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-[#d4a574] flex-shrink-0" />
                        <span className="text-[14px] font-medium text-foreground">
                          {company.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 text-center">
                      <span className="text-[14px] text-foreground font-medium">
                        {company.totalProjects}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <span className="text-[13px] text-muted-foreground">
                        {company.createdAt}
                      </span>
                    </TableCell>

                    <TableCell
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() => onEditCompany?.(company.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => onDeleteCompany?.(company.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow
                      key={`${company.id}-projects`}
                      className="hover:bg-transparent border-b border-border"
                    >
                      <TableCell colSpan={5} className="p-0">
                        <CompanyProjectsTable
                          projects={company.projects}
                          onCreateProject={() => onCreateProject?.(company.id)}
                          onEditProject={onEditProject}
                          onDeleteProject={onDeleteProject}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[13px] text-muted-foreground">
        <span>
          Mostrando {start}–{end} de {filtered.length} empresas
        </span>
        <Pagination total={filtered.length} page={page} onPage={setPage} />
      </div>
    </div>
  );
}