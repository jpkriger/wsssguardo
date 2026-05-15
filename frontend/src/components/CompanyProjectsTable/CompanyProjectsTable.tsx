import { Plus, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ProjectStatus = "Planejado" | "Em andamento" | "Atrasado";

export interface CompanyProject {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

const statusConfig: Record<ProjectStatus, { className: string }> = {
  Planejado: {
    className: "bg-blue-500/10 text-blue-400 border border-blue-500/50 px-2.5 py-0.5 rounded-sm font-medium",
  },
  "Em andamento": {
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/60 px-2.5 py-0.5 rounded-sm font-medium",
  },
  Atrasado: {
    className: "bg-red-500/10 text-red-400 border border-red-500/50 px-2.5 py-0.5 rounded-sm font-medium",
  },
};

interface CompanyProjectsTableProps {
  projects: CompanyProject[];
  onCreateProject?: () => void;
  onEditProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

export function CompanyProjectsTable({
  projects,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: CompanyProjectsTableProps): React.JSX.Element {
  return (
    <div className="mx-5 mt-4 mb-4 ml-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold text-foreground tracking-wide uppercase">
          Projetos da Empresa
        </span>

        <Button
          size="sm"
          onClick={onCreateProject}
          className="h-8 px-4 text-[12px] font-medium border-0 transition-all
             bg-[#D4A574] text-[#0F1117] hover:bg-[#C39A5E]
             dark:bg-[#1F2937] dark:text-[#D4A574] dark:hover:bg-[#374151]"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Criar Projeto
        </Button>
      </div>

      {/* Container da tabela */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <FolderOpen className="h-8 w-8 text-[#d4a574] flex-shrink-0" />
            <p className="text-[13px] text-muted-foreground">Nenhum projeto cadastrado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                {["Nome do Projeto", "Data Início", "Data Término", "Status", "Ações"].map(
                  (label, i) => (
                    <TableHead
                      key={label}
                      className={cn(
                        "text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-2.5",
                        i === 4 && "text-right",
                      )}
                    >
                      {label}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2 ">
                      <FolderOpen className="h-3.5 w-3.5 text-[#d4a574] flex-shrink-0" />
                      <span className="text-[13px] text-foreground">{project.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">
                    {project.startDate}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">
                    {project.endDate}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-md",
                        statusConfig[project.status].className,
                      )}
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => onEditProject?.(project.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => onDeleteProject?.(project.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}