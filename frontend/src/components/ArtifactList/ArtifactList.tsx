import { useEffect, useMemo, useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  listArtifacts,
  type ArtifactResponse,
} from "../../api/artifact";
import ArtifactRow from "../ArtifactRow/ArtifactRow";
import { cn } from "../../lib/utils";

const PAGE_SIZE = 5;

interface ArtifactListProps {
  refreshKey?: number;
  projectId?: string;
  artifacts?: ArtifactResponse[];
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ArtifactResponse>) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function ArtifactList({
  refreshKey = 0,
  projectId,
  artifacts: propArtifacts,
  onDelete,
  onDownload,
  onUpdate,
}: ArtifactListProps): ReactElement {
  const isControlled = propArtifacts !== undefined;
  const [fetchedArtifacts, setFetchedArtifacts] = useState<ArtifactResponse[]>([]);
  const artifacts = isControlled ? propArtifacts : fetchedArtifacts;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isControlled) return;
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function load(): Promise<void> {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      setFetchedArtifacts(await listArtifacts(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleDelete(id: string): void { onDelete?.(id); }
  function handleDownload(id: string): void { onDownload?.(id); }

  const totalPages = Math.ceil(artifacts.length / PAGE_SIZE);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return artifacts.slice(start, start + PAGE_SIZE);
  }, [artifacts, currentPage]);

  const pageStart = artifacts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, artifacts.length);

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "#121416" }}>
      {/* Title */}
      <div className="px-8 pt-6 pb-3">
        <h2 className="text-2xl font-normal text-foreground leading-tight">
          Artefatos coletados
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Documentos e notas que sustentam os achados da análise
        </p>
      </div>

      {/* Error / Loading / Empty states */}
      {error && (
        <p className="text-destructive text-sm px-8 pb-4">{error}</p>
      )}
      {loading && (
        <p className="text-muted-foreground text-sm px-8 pb-4">Carregando…</p>
      )}
      {!loading && artifacts.length === 0 && !error && (
        <p className="text-muted-foreground text-sm py-12 text-center">
          Nenhum artefato encontrado.
        </p>
      )}

      {/* Table */}
      {artifacts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                  Artefato
                </th>
                <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                  Tipo de arquivo
                </th>
                <th className="px-5 py-3 text-left text-lg font-normal text-foreground whitespace-nowrap">
                  Resumo
                </th>
                <th className="px-5 py-3 text-center text-lg font-normal text-foreground whitespace-nowrap">
                  Achados ligados
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((artifact) => (
                <ArtifactRow
                  key={artifact.id}
                  artifact={artifact}
                  isExpanded={expandedId === artifact.id}
                  onToggleExpand={toggleExpand}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onUpdate={onUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {artifacts.length > 0 && (
        <div className="flex items-center justify-between px-8 py-5">
          <span className="text-base text-muted-foreground">
            Mostrando {pageStart}-{pageEnd} de {artifacts.length} artefatos
          </span>

          <div className="flex items-center gap-2">
            {/* Anterior */}
            <button
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium outline-none border-none bg-transparent transition-opacity",
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : "cursor-pointer text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {/* Page numbers */}
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
                      ? "border border-foreground/40 text-foreground cursor-default"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={page === currentPage ? { border: "1px solid #E5E5E5" } : {}}
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </button>
              )
            )}

            {/* Próximo */}
            <button
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium outline-none border-none bg-transparent transition-opacity",
                currentPage === totalPages
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : "cursor-pointer text-muted-foreground hover:text-foreground"
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
    </div>
  );
}
