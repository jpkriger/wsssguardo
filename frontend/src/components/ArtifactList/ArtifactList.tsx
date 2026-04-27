import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  listArtifacts,
  deleteArtifact,
  updateArtifact,
  createArtifact,
  type ArtifactResponse
} from "../../api/artifact";
import ArtifactRow from "../ArtifactRow/ArtifactRow";
import NewArtifactComposer from "../NewArtifactComposer/NewArtifactComposer";
import NewNoteComposer from "../NewNoteComposer/NewNoteComposer";
import { cn } from "../../lib/utils";
import { type NoteCreateRequest } from "../../api/note";

const PAGE_SIZE = 5;

interface ArtifactListProps {
  refreshKey?: number;
  projectId?: string;
  artifacts?: ArtifactResponse[];
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ArtifactResponse>) => void;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
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
  const [fetchedArtifacts, setFetchedArtifacts] = useState<ArtifactResponse[]>(
    [],
  );
  const artifacts = isControlled ? propArtifacts : fetchedArtifacts;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);

  const load = useCallback(async (): Promise<void> => {
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
  }, [projectId]);

  useEffect(() => {
    if (isControlled) return;
    void load();
  }, [refreshKey, projectId, isControlled, load]);

  function toggleExpand(id: string): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleDelete(id: string): Promise<void> {
    if (onDelete) {
      onDelete(id);
      return;
    }
    if (!projectId) return;
    try {
      await deleteArtifact(projectId, id);
      setFetchedArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir artefato");
    }
  }

  async function handleUpdate(
    id: string,
    updates: Partial<ArtifactResponse>,
  ): Promise<void> {
    if (onUpdate) {
      onUpdate(id, updates);
      return;
    }
    if (!projectId) return;
    try {
      const updated = await updateArtifact(
        projectId,
        id,
        updates
      );
      setFetchedArtifacts((prev) =>
        prev.map((a) => (a.id === id ? updated : a)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar artefato");
    }
  }

  function handleDownload(id: string): void {
    onDownload?.(id);
  }

  async function handleCreate(
    data: Omit<
      ArtifactResponse,
      | "id"
      | "createdAt"
      | "lastEditedAt"
      | "lastEditedBy"
      | "author"
      | "findings"
    >,
  ): Promise<void> {
    if (!projectId) return;
    try {
      const created = await createArtifact(
        projectId,
        data
      );
      setFetchedArtifacts((prev) => [...prev, created]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar artefato");
    }
  }

  async function handleCreateNote(note: NoteCreateRequest): Promise<void> {
    if (!projectId) return;
    const created = await createArtifact(projectId, {
      name: note.title,
      content: note.content,
      contentType: "note",
    });
    setFetchedArtifacts((prev) => [...prev, created]);
  }

  const totalPages = Math.ceil(artifacts.length / PAGE_SIZE);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return artifacts.slice(start, start + PAGE_SIZE);
  }, [artifacts, currentPage]);

  const pageStart =
    artifacts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, artifacts.length);

  return (
    <div className="rounded-[20px] overflow-hidden bg-card">
      <div className="px-8 pt-6 pb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-foreground leading-tight">
            Artefatos coletados
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Documentos e notas que sustentam os achados da análise
          </p>
        </div>
        {!isControlled && projectId && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border border-border cursor-pointer"
              onClick={() => setNoteComposerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Nota
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border-none cursor-pointer"
              onClick={() => setComposerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        )}
      </div>

      <NewArtifactComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onSaveArtifact={(data) => {
          void handleCreate(data);
        }}
      />
      <NewNoteComposer
        open={noteComposerOpen}
        onOpenChange={setNoteComposerOpen}
        onSaveNote={handleCreateNote}
        onSave={() => setNoteComposerOpen(false)}
      />

      {error && <p className="text-destructive text-sm px-8 pb-4">{error}</p>}
      {loading && (
        <p className="text-muted-foreground text-sm px-8 pb-4">Carregando…</p>
      )}
      {!loading && artifacts.length === 0 && !error && (
        <p
          className="text-muted-foreground text-sm text-center flex items-center justify-center"
          style={{ minHeight: "273px" }}
        >
          Nenhum artefato encontrado.
        </p>
      )}

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
                  onUpdate={handleUpdate}
                />
              ))}
              {Array.from({
                length: Math.max(0, PAGE_SIZE - paged.length),
              }).map((_, i) => (
                <tr key={`ghost-${i}`} aria-hidden="true">
                  <td colSpan={4} className="px-5 py-2.5">
                    <span className="inline-flex px-4 py-2 text-sm invisible">
                      ghost
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="flex items-center justify-between px-8 py-5">
          <span className="text-base text-muted-foreground">
            Mostrando {pageStart}-{pageEnd} de {artifacts.length} artefatos
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
    </div>
  );
}
