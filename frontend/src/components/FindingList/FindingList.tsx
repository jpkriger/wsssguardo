import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  listFindings,
  deleteFinding,
  createFinding,
  updateFinding,
  type FindingResponse,
  type FindingSeverity,
} from "../../api/finding";
import { cn } from "../../lib/utils";
import FindingModal, {
  type FindingModalSubmitData,
} from "../FindingModal/FindingModal";

const PAGE_SIZE = 5;

const STORAGE_KEY = "sguardo-finding-columns";

interface ColumnDef {
  key: string;
  label: string;
}

const OPTIONAL_COLUMNS: ColumnDef[] = [
  { key: "descricao", label: "Descrição" },
  { key: "severidadeNum", label: "Severidade Numérica" },
  { key: "severidadeCat", label: "Severidade Categórica" },
  { key: "categoria", label: "Categoria" },
  { key: "ativosLigados", label: "Ativos Ligados" },
  { key: "artefatosLigados", label: "Artefatos Ligados" },
  { key: "referencia", label: "Referência" },
];

const ALL_KEYS = new Set(OPTIONAL_COLUMNS.map((c) => c.key));

function loadVisibleCols(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed as string[]);
    }
  } catch {
    // ignore
  }
  return new Set(ALL_KEYS);
}

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
  INFO: "Info",
};

const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  CRITICAL: "text-red-600",
  HIGH: "text-red-500",
  MEDIUM: "text-yellow-400",
  LOW: "text-green-500",
  INFO: "text-blue-400",
};

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) return [1, 2, 3, "...", totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2)
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

interface FindingListProps {
  projectId: string;
}

export default function FindingList({ projectId }: FindingListProps): ReactElement {
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(loadVisibleCols);
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalFinding, setModalFinding] = useState<FindingResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) {
        setColsOpen(false);
      }
    }
    if (colsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colsOpen]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      setFindings(await listFindings(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar achados");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await deleteFinding(projectId, id);
      setFindings((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir achado");
    }
  }

  async function handleModalSubmit(data: FindingModalSubmitData): Promise<void> {
    setModalLoading(true);
    try {
      if (data.id) {
        const updated = await updateFinding(projectId, data.id, {
          name: data.name,
          description: data.description,
          numericSeverity: data.numericSeverity,
          categoricalSeverity: data.categoricalSeverity,
          category: data.category,
          reference: data.reference,
          linkedAssetIds: data.linkedAssetIds,
          linkedArtifactIds: data.linkedArtifactIds,
        });
        setFindings((prev) => prev.map((f) => (f.id === data.id ? updated : f)));
      } else {
        const created = await createFinding(projectId, {
          name: data.name,
          description: data.description,
          numericSeverity: data.numericSeverity,
          categoricalSeverity: data.categoricalSeverity,
          category: data.category,
          reference: data.reference,
          linkedAssetIds: data.linkedAssetIds,
          linkedArtifactIds: data.linkedArtifactIds,
        });
        setFindings((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar achado");
    } finally {
      setModalLoading(false);
    }
  }

  function openCreate(): void {
    setModalMode("create");
    setModalFinding(null);
    setModalOpen(true);
  }

  function openEdit(finding: FindingResponse): void {
    setModalMode("edit");
    setModalFinding(finding);
    setModalOpen(true);
  }

  function toggleCol(key: string): void {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const totalPages = Math.ceil(findings.length / PAGE_SIZE);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return findings.slice(start, start + PAGE_SIZE);
  }, [findings, currentPage]);

  const pageStart = findings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, findings.length);

  const vis = visibleCols;

  return (
    <div className="rounded-[20px] overflow-hidden bg-card">
      {/* Header */}
      <div className="px-8 pt-6 pb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-foreground leading-tight">
            Achados identificados
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vulnerabilidades e observações encontradas durante a análise
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Column visibility selector */}
          <div className="relative" ref={colsRef}>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border border-border cursor-pointer"
              onClick={() => setColsOpen((o) => !o)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Colunas
            </button>
            {colsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Colunas visíveis
                </p>
                {OPTIONAL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 py-1 cursor-pointer text-sm text-foreground hover:text-foreground/80"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={vis.has(col.key)}
                      onChange={() => toggleCol(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border-none cursor-pointer"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* States */}
      {error && <p className="text-destructive text-sm px-8 pb-4">{error}</p>}
      {loading && (
        <p className="text-muted-foreground text-sm px-8 pb-4">Carregando…</p>
      )}
      {!loading && findings.length === 0 && !error && (
        <p
          className="text-muted-foreground text-sm text-center flex items-center justify-center"
          style={{ minHeight: "273px" }}
        >
          Nenhum achado encontrado.
        </p>
      )}

      {/* Table */}
      {findings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                  Achado
                </th>
                {vis.has("descricao") && (
                  <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                    Descrição
                  </th>
                )}
                {vis.has("severidadeNum") && (
                  <th className="px-5 py-3 text-center text-lg font-normal text-foreground whitespace-nowrap">
                    Severidade Numérica
                  </th>
                )}
                {vis.has("severidadeCat") && (
                  <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                    Severidade Categórica
                  </th>
                )}
                {vis.has("categoria") && (
                  <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                    Categoria
                  </th>
                )}
                {vis.has("ativosLigados") && (
                  <th className="px-5 py-3 text-center text-lg font-normal text-foreground whitespace-nowrap">
                    Ativos Ligados
                  </th>
                )}
                {vis.has("artefatosLigados") && (
                  <th className="px-5 py-3 text-center text-lg font-normal text-foreground whitespace-nowrap">
                    Artefatos Ligados
                  </th>
                )}
                {vis.has("referencia") && (
                  <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                    Referência
                  </th>
                )}
                <th className="px-5 py-3 text-center text-lg font-normal text-foreground whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((finding) => (
                <tr
                  key={finding.id}
                  className="border-t border-border hover:bg-muted/40 transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-foreground font-medium">
                    {finding.name}
                  </td>
                  {vis.has("descricao") && (
                    <td className="px-5 py-3 text-sm text-muted-foreground max-w-[220px] truncate">
                      {finding.description ?? "—"}
                    </td>
                  )}
                  {vis.has("severidadeNum") && (
                    <td className="px-5 py-3 text-sm text-center text-foreground">
                      {finding.numericSeverity ?? "—"}
                    </td>
                  )}
                  {vis.has("severidadeCat") && (
                    <td className="px-5 py-3 text-sm">
                      {finding.categoricalSeverity ? (
                        <span
                          className={cn(
                            "font-medium",
                            SEVERITY_COLORS[finding.categoricalSeverity],
                          )}
                        >
                          {SEVERITY_LABELS[finding.categoricalSeverity]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  {vis.has("categoria") && (
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {finding.category ?? "—"}
                    </td>
                  )}
                  {vis.has("ativosLigados") && (
                    <td className="px-5 py-3 text-sm text-center text-foreground">
                      {finding.linkedAssetIds.length}
                    </td>
                  )}
                  {vis.has("artefatosLigados") && (
                    <td className="px-5 py-3 text-sm text-center text-foreground">
                      {finding.linkedArtifactIds.length}
                    </td>
                  )}
                  {vis.has("referencia") && (
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {finding.reference ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="Editar achado"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer border-none bg-transparent outline-none"
                        onClick={() => openEdit(finding)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Excluir achado"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none bg-transparent outline-none"
                        onClick={() => void handleDelete(finding.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, PAGE_SIZE - paged.length) }).map(
                (_, i) => (
                  <tr key={`ghost-${i}`} aria-hidden="true">
                    <td
                      colSpan={
                        1 +
                        OPTIONAL_COLUMNS.filter((c) => vis.has(c.key)).length +
                        1
                      }
                      className="px-5 py-2.5"
                    >
                      <span className="inline-flex px-4 py-2 text-sm invisible">
                        ghost
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {findings.length > 0 && (
        <div className="flex items-center justify-between px-8 py-5">
          <span className="text-base text-muted-foreground">
            Mostrando {pageStart}-{pageEnd} de {findings.length} achados
          </span>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium outline-none border-none bg-transparent transition-opacity",
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : "cursor-pointer text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            {getPageNumbers(currentPage, totalPages).map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex items-center justify-center w-9 h-9 text-sm text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium outline-none border-none bg-transparent transition-colors cursor-pointer",
                    page === currentPage
                      ? "border border-border text-foreground cursor-default"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
            <button
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium outline-none border-none bg-transparent transition-opacity",
                currentPage === totalPages
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : "cursor-pointer text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <FindingModal
        open={modalOpen}
        loading={modalLoading}
        mode={modalMode}
        finding={modalFinding}
        projectId={projectId}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => void handleModalSubmit(data)}
      />
    </div>
  );
}
