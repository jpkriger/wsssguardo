import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import styles from "./ProjectsTable.module.css";

// Types

export type RiskLevel = "alto" | "medio" | "baixo";

export interface ProjectRisk {
  level: RiskLevel;
  count: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
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
    className:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}): React.JSX.Element {
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted border border-border">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[11px] font-bold text-muted-foreground">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function ProgressBar({
  value,
  total,
}: {
  value: number;
  total: number;
}): React.JSX.Element {
  const pct = Math.min(100, Math.round(((total - value) / total) * 100));
  return (
    <div className="flex flex-col gap-1 w-40">
      <div className={styles["progress-track"]}>
        <div className={styles["progress-bar"]} style={{ width: `${pct}%` }} />
      </div>
      <span className="!text-[14px] text-muted-foreground">
        Restam {value} dias
      </span>
    </div>
  );
}

function RiskBadges({ risks }: { risks: Project["risks"] }): React.JSX.Element {
  const hasThreeRisks = risks.length === 3;

  return (
    <div
      className={cn(
        styles["risk-badges"],
        hasThreeRisks && styles["risk-badges--three"],
      )}
    >
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
            {risk.count} {cfg.label}
            {risk.count !== 1 ? "s" : ""}
          </Badge>
        );
      })}
    </div>
  );
}

// Pagination

const PAGE_SIZE = 5;

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
        disabled={page === Math.ceil(total / PAGE_SIZE)}
        className="flex items-center gap-0.5"
      >
        Próximo <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Main

const ALL_CONSULTANTS_LABEL = "Todos consultores";

interface ProjectsTableProps {
  projects: Project[];
  totalCount: number;
}

type SortField = "name" | "daysRemaining" | "consultant";

export function ProjectsTable({
  projects,
  totalCount,
}: ProjectsTableProps): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [consultant, setConsultant] = useState(ALL_CONSULTANTS_LABEL);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirections, setSortDirections] = useState<Record<SortField, boolean>>({
    name: true,
    daysRemaining: true,
    consultant: true,
  });

  const consultantOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        projects
          .map((project) => project.consultant.name)
          .filter((name) => name.trim().length > 0),
      ),
    );

    return [ALL_CONSULTANTS_LABEL, ...names];
  }, [projects]);

  useEffect(() => {
    if (!consultantOptions.includes(consultant)) {
      setConsultant(ALL_CONSULTANTS_LABEL);
    }
  }, [consultant, consultantOptions]);

  useEffect(() => {
    setPage(1);
  }, [projects]);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchConsultant =
      consultant === ALL_CONSULTANTS_LABEL || p.consultant.name === consultant;
    return matchSearch && matchConsultant;
  });

  const sorted = useMemo(() => {
    const activeSortAsc = sortDirections[sortField];

    return [...filtered].sort((a, b) => {
      if (sortField === "name") {
        return activeSortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      else if (sortField === "consultant") {
        return activeSortAsc
          ? a.consultant.name.localeCompare(b.consultant.name)
          : b.consultant.name.localeCompare(a.consultant.name);
      }
      else {
        return activeSortAsc
          ? a.daysRemaining - b.daysRemaining
          : b.daysRemaining - a.daysRemaining;
      }
    });
  }, [filtered, sortField, sortDirections]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <h2 className="!text-[24px] text-foreground">Projetos</h2>
          <p className="!text-[14px] text-muted-foreground mt-0.5">
            {totalCount} auditorias registradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar projetos"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 !text-[12px] w-44"
          />
          <Select
            value={consultant}
            onValueChange={(v) => {
              if (v) {
                setConsultant(v);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="h-8 !text-[12px] w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {consultantOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {["Projeto", "Tempo restante", "Consultor", "Riscos", "Ação"].map(
              (label, i) => {
                const isSortable = i === 0 || i === 1 || i === 2;

                let currentField: SortField = "name";
                if (i === 1) currentField = "daysRemaining";
                if (i === 2) currentField = "consultant";

                const isProjectColumn = i === 0;
                const isActiveSort = sortField === currentField;
                const currentSortAsc = sortDirections[currentField];

                return (
                  <TableHead key={label} className="!text-[18px] px-5 py-3">
                    <span
                      className={cn(
                        "flex items-center gap-[10px] select-none",
                        isSortable &&
                          "cursor-pointer hover:text-foreground transition-colors",
                        i === 4 && "justify-end",
                      )}
                      onClick={() => {
                        if (!isSortable) return;

                        if (sortField === currentField) {
                          setSortDirections((prev) => ({
                            ...prev,
                            [currentField]: !prev[currentField],
                          }));
                          return;
                        }

                        setSortField(currentField);
                      }}
                    >
                      {label}

                      {isSortable &&
                        (isProjectColumn ? (
                          currentSortAsc ? (
                            <ChevronUp
                              className={cn(
                                "h-4 w-4",
                                !isActiveSort && "opacity-40",
                                styles["sort-icon"],
                              )}
                            />
                          ) : (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4",
                                !isActiveSort && "opacity-40",
                                styles["sort-icon"],
                              )}
                            />
                          )
                        ) : (
                          <ArrowUpDown
                            className={cn(
                              "h-4 w-4",
                              isActiveSort ? "text-foreground" : "opacity-40",
                              styles["sort-icon"],
                            )}
                          />
                        ))}
                    </span>
                  </TableHead>
                );
              },
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-muted-foreground"
              >
                Nenhum projeto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((project) => (
              <TableRow key={project.id} className={styles.row}>
                <TableCell className="px-5 py-4">
                  <p className="!text-[18px] font-semibold text-foreground">
                    {project.name}
                  </p>
                  <p className="!text-[12px] text-muted-foreground mt-0.5">
                    {project.code}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <ProgressBar
                    value={project.daysRemaining}
                    total={project.totalDays}
                  />
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={project.consultant.name}
                      avatarUrl={project.consultant.avatarUrl}
                    />
                    <span className="!text-[18px] text-foreground">
                      {project.consultant.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-5 py-4", styles["risk-cell"])}>
                  <RiskBadges risks={project.risks} />
                </TableCell>
                <TableCell className="px-5 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-[16px] gap-1"
                    onClick={() => void navigate(`/project/${project.id}`)}
                  >
                    Acessar <ChevronRight className="h-[18px] w-[18px]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border !text-[16px] text-muted-foreground">
        <span>
          Mostrando {start}-{end} de {filtered.length} projetos
        </span>
        <Pagination total={filtered.length} page={page} onPage={setPage} />
      </div>
    </div>
  );
}
