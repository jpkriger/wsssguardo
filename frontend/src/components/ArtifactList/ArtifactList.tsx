import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { File, FileText, Image, Plus } from "lucide-react";
import {
  listArtifacts,
  deleteArtifact,
  updateArtifact,
  createArtifact,
  ArtifactContentTypes,
  type ArtifactContentType,
  type ArtifactResponse,
} from "../../api/artifact";
import ArtifactExpandedContent from "../ArtifactExpandedContent/ArtifactExpandedContent";
import NewArtifactComposer from "../NewArtifactComposer/NewArtifactComposer";
import NewNoteComposer from "../NewNoteComposer/NewNoteComposer";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { type NoteCreateRequest } from "../../api/note";
import { toast } from "sonner";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";
import { formatDateTime } from "../../lib/format-date";

const PAGE_SIZE = 5;

const BADGE_LABELS: Record<ArtifactContentType, string> = {
  [ArtifactContentTypes.Document]: "DOC",
  [ArtifactContentTypes.Image]: "IMG",
  [ArtifactContentTypes.Note]: "NOTA",
  [ArtifactContentTypes.Sheet]: "PLANILHA",
};

function FileTypeIcon({ contentType }: { contentType: ArtifactContentType }): ReactElement {
  if (contentType === ArtifactContentTypes.Document) return <File className="h-4 w-4" />;
  if (contentType === ArtifactContentTypes.Image) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

interface ArtifactListProps {
  refreshKey?: number;
  projectId?: string;
  artifacts?: ArtifactResponse[];
  onDelete?: (id: string) => void | Promise<void>;
  onDownload?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ArtifactResponse>) => void;
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<ArtifactResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
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

  function requestDelete(id: string): void {
    const artifact = artifacts.find((item) => item.id === id);
    if (!artifact) {
      setError("Artefato não encontrado para exclusão");
      return;
    }
    setArtifactToDelete(artifact);
    setConfirmDeleteOpen(true);
  }

  async function handleDelete(): Promise<void> {
    if (!artifactToDelete) return;

    if (onDelete) {
      setDeleting(true);
      setError(null);
      try {
        await Promise.resolve(onDelete(artifactToDelete.id));
        setConfirmDeleteOpen(false);
        setArtifactToDelete(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir artefato");
      } finally {
        setDeleting(false);
      }
      return;
    }

    if (!projectId) {
      setConfirmDeleteOpen(false);
      setArtifactToDelete(null);
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteArtifact(projectId, artifactToDelete.id);
      setFetchedArtifacts((prev) => prev.filter((a) => a.id !== artifactToDelete.id));
      setConfirmDeleteOpen(false);
      setArtifactToDelete(null);
      toast.success("Artefato excluído com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir artefato");
      toast.error("Falha ao excluir artefato.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdate(id: string, updates: Partial<ArtifactResponse>): Promise<void> {
    if (onUpdate) {
      onUpdate(id, updates);
      return;
    }
    if (!projectId) return;
    try {
      const updated = await updateArtifact(projectId, id, updates);
      setFetchedArtifacts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success("Artefato atualizado com sucesso.");
    } catch (e) {
      toast.error("Falha ao editar artefato.");
      throw e;
    }
  }

  async function handleCreate(
    data: Omit<ArtifactResponse, "id" | "createdAt" | "lastEditedAt" | "lastEditedBy" | "author" | "findings">,
  ): Promise<void> {
    if (!projectId) return;
    try {
      const created = await createArtifact(projectId, data);
      setFetchedArtifacts((prev) => [...prev, created]);
      setComposerOpen(false);
      toast.success("Artefato criado com sucesso.");
    } catch (e) {
      toast.error("Falha ao criar artefato.");
      throw e;
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
    setNoteComposerOpen(false);
  }

  const columns: ColumnDefinition<ArtifactResponse>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Artefato",
        isRequired: true,
        getSortValue: (a) => a.name,
        renderCell: (a) => <span className="font-medium">{a.name}</span>,
      },
      {
        id: "contentType",
        label: "Tipo de arquivo",
        getSortValue: (a) => a.contentType,
        renderCell: (a) => (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-secondary">
            <FileTypeIcon contentType={a.contentType} />
            {a.fileLabel ?? BADGE_LABELS[a.contentType]}
          </span>
        ),
      },
      {
        id: "description",
        label: "Resumo",
        getSortValue: (a) => a.description,
        renderCell: (a) => (
          <span className="block truncate max-w-xs text-muted-foreground">
            {a.description}
          </span>
        ),
      },
      {
        id: "findingsCount",
        label: "Achados ligados",
        headClassName: "text-center",
        cellClassName: "text-center",
        getSortValue: (a) =>
          a.findings ? a.findings.high + a.findings.medium + a.findings.low : 0,
        renderCell: (a) =>
          String(a.findings ? a.findings.high + a.findings.medium + a.findings.low : 0),
      },
      {
        id: "createdBy",
        label: "Criado por",
        getSortValue: (a) => a.author,
        renderCell: (a) => (
          <span className="text-foreground whitespace-nowrap">
            {a.author ?? "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        label: "Data de criação",
        dataType: "date",
        getSortValue: (a) => a.createdAt,
        renderCell: (a) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDateTime(a.createdAt)}
          </span>
        ),
      },
      {
        id: "updatedAt",
        label: "Última alteração",
        dataType: "date",
        getSortValue: (a) => a.lastEditedAt ?? a.updatedAt ?? a.createdAt,
        renderCell: (a) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDateTime(a.lastEditedAt ?? a.updatedAt ?? a.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  function renderExpandable(
    artifact: ArtifactResponse,
    { close }: { close: () => void },
  ): ReactElement {
    return (
      <ArtifactExpandedContent
        artifact={artifact}
        onEdit={() => {}}
        onDelete={requestDelete}
        onDownload={() => onDownload?.(artifact.id)}
        onUpdate={handleUpdate}
        onClose={close}
      />
    );
  }

  const showActions = !isControlled && !!projectId;

  return (
    <>
      <GenericTable
        tableId="artifact-list"
        data={artifacts}
        columns={columns}
        clientPagination
        clientSearch
        pageSize={PAGE_SIZE}
        isLoading={loading}
        error={error}
        title="Artefatos coletados"
        subtitle="Documentos e notas que sustentam os achados da análise"
        filters={[
          {
            id: "author",
            label: "Quem criou",
            type: "select",
            getValue: (a) => a.author,
          },
          {
            id: "createdAt",
            label: "Data de criação",
            type: "dateRange",
            getValue: (a) => a.createdAt,
          },
        ]}
        primaryAction={
          showActions
            ? { label: "Adicionar", icon: Plus, onClick: () => setComposerOpen(true) }
            : undefined
        }
        headerExtra={
          showActions ? (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border border-border cursor-pointer"
              onClick={() => setNoteComposerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Nota
            </button>
          ) : undefined
        }
        emptyMessage="Nenhum artefato encontrado."
        expandableContent={renderExpandable}
      />

      {showActions && (
        <>
          <NewArtifactComposer
            open={composerOpen}
            onOpenChange={setComposerOpen}
            onSaveArtifact={(data) => { void handleCreate(data); }}
          />
          <NewNoteComposer
            open={noteComposerOpen}
            onOpenChange={setNoteComposerOpen}
            onSaveNote={handleCreateNote}
            onSave={() => setNoteComposerOpen(false)}
          />
        </>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o artefato "${artifactToDelete?.name ?? ""}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => {
          if (deleting) return;
          setConfirmDeleteOpen(false);
          setArtifactToDelete(null);
        }}
        loading={deleting}
      />
    </>
  );
}
