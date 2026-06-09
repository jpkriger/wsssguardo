import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactElement,
} from "react";
import { LinkIcon, PlusIcon, Pencil, Trash2 } from "lucide-react";

import { useProject } from "@/contexts/ProjectContext";
import {
  fetchAllAssetsByProject,
  deleteAsset,
  createAsset,
  updateAsset,
  type AssetResponse,
} from "@/api/asset";
import AssetModal, {
  type AssetModalSubmitData,
  type AssetModalAsset,
} from "../AssetModal/AssetModal";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { toast } from "sonner";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";
import { formatDateTime } from "@/lib/format-date";

const PAGE_SIZE = 5;

export default function AssetTable(): ReactElement {
  const { projectId } = useProject();

  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAsset, setSelectedAsset] = useState<AssetModalAsset | null>(
    null,
  );
  const [modalLoading, setModalLoading] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<AssetResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssets(await fetchAllAssetsByProject(projectId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar ativos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  async function handleDelete(id: string): Promise<void> {
    setDeleting(true);
    try {
      await deleteAsset(projectId, id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setError(null);
      toast.success("Ativo excluido com sucesso.");
    } catch {
      toast.error("Falha ao excluir ativo.");
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(asset: AssetResponse): void {
    setSelectedAsset({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      content: asset.content,
    });
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleCreate(): void {
    setSelectedAsset(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleSubmit(data: AssetModalSubmitData): Promise<void> {
    setModalLoading(true);
    setError(null);
    try {
      if (modalMode === "create") {
        await createAsset(projectId, {
          name: data.name,
          description: data.description,
          content: data.content,
        });
      } else if (modalMode === "edit" && data.id) {
        await updateAsset(projectId, data.id, {
          name: data.name,
          description: data.description,
          content: data.content,
        });
      }
      setModalOpen(false);
      await loadAssets();
      setError(null);
      toast.success(
        modalMode === "create"
          ? "Ativo criado com sucesso."
          : "Ativo atualizado com sucesso.",
      );
    } catch {
      toast.error(
        modalMode === "create"
          ? "Falha ao criar ativo."
          : "Falha ao atualizar ativo.",
      );
    } finally {
      setModalLoading(false);
    }
  }

  const columns: ColumnDefinition<AssetResponse>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Ativo",
        getSortValue: (a) => a.name,
        isRequired: true,
        width: "18%",
        renderCell: (asset) => (
          <span className="text-sm text-foreground font-medium">
            {asset.name}
          </span>
        ),
      },
      {
        id: "description",
        label: "Descrição",
        getSortValue: (a) => a.description,
        width: "32%",
        renderCell: (asset) => (
          <span className="text-sm text-muted-foreground">
            {asset.description}
          </span>
        ),
      },
      {
        id: "content",
        label: "Referência",
        width: "20%",
        renderCell: (asset) => (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground blur-[2.5px] select-none">
              {asset.content && asset.content.length > 20
                ? `${asset.content.slice(0, 20)}…`
                : (asset.content ?? "—")}
            </span>
            {asset.content && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(asset.content, "_blank");
                }}
                className="inline-flex items-center justify-center p-1 rounded opacity-80 hover:opacity-100 hover:bg-muted transition-all bg-transparent border-none cursor-pointer"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ),
      },
      {
        id: "findingsCount",
        label: "Achados ligados",
        width: "18%",
        renderCell: (asset) => (
          <span className="text-sm text-center block">
            {asset.findingsCount}
          </span>
        ),
      },
      {
        id: "createdBy",
        label: "Criado por",
        getSortValue: (a) => a.createdBy,
        renderCell: (asset) => (
          <span className="text-sm text-foreground whitespace-nowrap">
            {asset.createdBy ?? "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        label: "Data de criação",
        dataType: "date",
        getSortValue: (a) => a.createdAt,
        renderCell: (asset) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTime(asset.createdAt)}
          </span>
        ),
      },
      {
        id: "updatedAt",
        label: "Última alteração",
        dataType: "date",
        getSortValue: (a) => a.updatedAt ?? a.createdAt,
        renderCell: (asset) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTime(asset.updatedAt ?? asset.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <GenericTable
        tableId="asset-table"
        data={assets}
        columns={columns}
        clientPagination
        clientSearch
        pageSize={PAGE_SIZE}
        isLoading={loading}
        error={error}
        filters={[
          {
            id: "createdBy",
            label: "Quem criou",
            type: "select",
            getValue: (a) => a.createdBy,
          },
          {
            id: "createdAt",
            label: "Data de criação",
            type: "dateRange",
            getValue: (a) => a.createdAt,
          },
        ]}
        title="Ativos"
        subtitle="Ativos registrados e vinculados ao escopo da avaliação"
        primaryAction={{
          label: "Novo Ativo",
          icon: PlusIcon,
          onClick: handleCreate,
        }}
        rowActions={[
          {
            icon: Pencil,
            label: "Editar",
            onClick: (asset) => handleEdit(asset),
          },
          {
            icon: Trash2,
            label: "Excluir",
            onClick: (asset) => {
              setAssetToDelete(asset);
              setConfirmDeleteOpen(true);
            },
            variant: "destructive",
          },
        ]}
        enableSorting
        enableColumnToggle
      />

      <AssetModal
        open={modalOpen}
        loading={modalLoading}
        mode={modalMode}
        asset={selectedAsset}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          void handleSubmit(data);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o ativo "${assetToDelete?.name ?? ""}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={async () => {
          if (assetToDelete) {
            await handleDelete(assetToDelete.id);
          }
          setConfirmDeleteOpen(false);
          setAssetToDelete(null);
        }}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAssetToDelete(null);
        }}
        loading={deleting}
      />
    </>
  );
}
