import { Fragment, useEffect, useMemo, useState, type ReactElement } from "react";
import { Plus } from "lucide-react";
import {
  listFindings,
  deleteFinding,
  createFinding,
  updateFinding,
  type FindingResponse,
  type FindingSeverity,
} from "../../api/finding";
import FindingModal, {
  type FindingModalSubmitData,
} from "../FindingModal/FindingModal";
import CategoryFilter from "../CategoryFilter/CategoryFilter";

const PAGE_SIZE = 5;

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
  INFO: "Info",
};

const SEVERITY_BADGE: Record<FindingSeverity, string> = {
  CRITICAL: "bg-red-700 text-white",
  HIGH: "bg-red-600 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-green-600 text-white",
  INFO: "bg-blue-500 text-white",
};

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [categoryConfig, setCategoryConfig] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalFinding, setModalFinding] = useState<FindingResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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
      if (expandedId === id) setExpandedId(null);
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

  const categoryColumns = useMemo(
    () =>
      [...new Set(findings.flatMap((f) => (f.category ? [f.category] : [])))].sort().map((cat) => ({ id: cat, label: cat })),
    [findings],
  );

  useEffect(() => {
    setCategoryConfig(Object.fromEntries(categoryColumns.map((c) => [c.id, false])));
    setCurrentPage(1);
  }, [categoryColumns]);

  function toggleCategory(columnId: string): void {
    setCategoryConfig((prev) => ({ ...prev, [columnId]: !prev[columnId] }));
  }

  function resetCategories(): void {
    setCategoryConfig(Object.fromEntries(categoryColumns.map((c) => [c.id, false])));
  }

  const filteredFindings = useMemo(() => {
    const activeFilters = Object.entries(categoryConfig).filter(([, v]) => v).map(([k]) => k);
    if (activeFilters.length === 0) return findings;
    return findings.filter((f) => f.category && activeFilters.includes(f.category));
  }, [findings, categoryConfig]);

  const totalPages = Math.ceil(filteredFindings.length / PAGE_SIZE);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFindings.slice(start, start + PAGE_SIZE);
  }, [filteredFindings, currentPage]);

  const pageStart = filteredFindings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredFindings.length);

  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-bold text-foreground">Achados</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Achados registrados e vinculados ao escopo da avaliação
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CategoryFilter
            columns={categoryColumns}
            visibleColumns={categoryConfig}
            onToggleColumn={(id) => { toggleCategory(id); setCurrentPage(1); }}
            onReset={resetCategories}
          />
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

      {error && <div className="text-destructive text-sm px-6 py-4">{error}</div>}
      {loading && (
        <div className="text-muted-foreground text-sm px-6 py-4">Carregando…</div>
      )}
      {!loading && findings.length === 0 && !error && (
        <div className="text-muted-foreground text-sm text-center py-16">
          Nenhum achado encontrado.
        </div>
      )}

      {findings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3" aria-label="Expandir" />
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  Classificação
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  Artefatos ligados
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((finding) => (
                <Fragment key={finding.id}>
                  <tr
                    className={`border-t border-border transition-colors ${
                      expandedId === finding.id
                        ? "bg-muted/30"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-sm leading-none p-1"
                        onClick={() =>
                          setExpandedId((prev) =>
                            prev === finding.id ? null : finding.id,
                          )
                        }
                        aria-label={
                          expandedId === finding.id ? "Recolher" : "Expandir"
                        }
                      >
                        {expandedId === finding.id ? "▴" : "▾"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                      {finding.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[260px] truncate">
                      {finding.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {finding.categoricalSeverity ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${SEVERITY_BADGE[finding.categoricalSeverity]}`}
                        >
                          {SEVERITY_LABELS[finding.categoricalSeverity]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-foreground">
                      {finding.linkedArtifactIds.length}
                    </td>
                  </tr>

                  {expandedId === finding.id && (
                    <tr className="border-t border-border bg-muted/10">
                      <td colSpan={5} className="px-8 py-4">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                            {finding.description && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Descrição: </span>
                                <span className="text-foreground">{finding.description}</span>
                              </div>
                            )}
                            {finding.category && (
                              <div>
                                <span className="text-muted-foreground">Categoria: </span>
                                <span className="text-foreground">{finding.category}</span>
                              </div>
                            )}
                            {finding.reference && (
                              <div>
                                <span className="text-muted-foreground">Referência: </span>
                                <span className="text-foreground">{finding.reference}</span>
                              </div>
                            )}
                            {finding.numericSeverity != null && (
                              <div>
                                <span className="text-muted-foreground">Severidade numérica: </span>
                                <span className="text-foreground">{finding.numericSeverity}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Ativos ligados: </span>
                              <span className="text-foreground">{finding.linkedAssetIds.length}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer"
                              onClick={() => openEdit(finding)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors bg-transparent cursor-pointer"
                              onClick={() => void handleDelete(finding.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {findings.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Mostrando {pageStart}-{pageEnd} de {filteredFindings.length} achados
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded border bg-transparent transition-colors ${
                currentPage === 1
                  ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                  : "border-border text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {getPageNumbers(currentPage, totalPages).map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex items-center justify-center w-8 h-8 text-sm text-muted-foreground"
                >
                  ···
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`flex items-center justify-center w-8 h-8 rounded text-sm transition-colors cursor-pointer border bg-transparent ${
                    page === currentPage
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded border bg-transparent transition-colors ${
                currentPage === totalPages
                  ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                  : "border-border text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo ›
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
