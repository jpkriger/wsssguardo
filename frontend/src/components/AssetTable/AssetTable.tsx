import { useState, useEffect, useCallback, type ReactElement } from "react";
import "./AssetTable.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  LinkIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PencilIcon,
  LoaderCircleIcon,
  PlusIcon,
} from "lucide-react";

import { useProject } from "@/contexts/ProjectContext";
import {
  fetchAssetsByProject,
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

const PAGE_SIZE = 5;

export default function AssetTable(): ReactElement {
  const { projectId } = useProject();

  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAsset, setSelectedAsset] = useState<AssetModalAsset | null>(
    null,
  );
  const [modalLoading, setModalLoading] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<AssetResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAssets = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAssetsByProject(
          projectId,
          targetPage,
          PAGE_SIZE,
        );
        setAssets(data.content);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar ativos";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void loadAssets(0);
  }, [loadAssets]);

  async function handleDelete(id: string): Promise<void> {
    setDeleting(true);
    try {
      await deleteAsset(id);

      // Lógica otimizada para evitar requisições desnecessárias
      const isLastItemOnPage = assets.length === 1;
      const isNotFirstPage = page > 0;

      if (isLastItemOnPage && isNotFirstPage) {
        await loadAssets(page - 1);
      } else {
        await loadAssets(page);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir ativo";
      setError(message);
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
        await createAsset({
          projectId,
          name: data.name,
          description: data.description,
          content: data.content,
        });
      } else if (modalMode === "edit" && data.id) {
        await updateAsset(data.id, {
          name: data.name,
          description: data.description,
          content: data.content,
        });
      }
      setModalOpen(false);
      await loadAssets(page);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar ativo";
      setError(message);
    } finally {
      setModalLoading(false);
    }
  }

  const displayPage = page + 1;
  const displayTotalPages = totalPages;
  const rangeStart = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Ativos</CardTitle>
          <CardDescription>
            Ativos registrados e vinculados ao escopo da avaliação
          </CardDescription>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          onClick={handleCreate}
        >
          <PlusIcon size={16} /> Novo Ativo
        </button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderCircleIcon
              className="animate-spin text-muted-foreground"
              size={32}
            />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum ativo encontrado.
          </div>
        ) : (
          <Table className="Table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Ativo</TableHead>
                <TableHead className="w-[30%]">Descrição</TableHead>
                <TableHead className="w-[15%]">Referência</TableHead>
                <TableHead className="text-center w-[15%]">
                  Achados ligados
                </TableHead>
                <TableHead className="w-[3%]"></TableHead>
                <TableHead className="w-[3%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.description}</TableCell>
                  <TableCell>
                    <div className="ref-cell">
                      <span className="ref-cell-text">
                        {asset.content && asset.content.length > 20
                          ? `${asset.content.slice(0, 20)}…`
                          : asset.content ?? "—"}
                      </span>
                      {asset.content && (
                        <button
                          onClick={() => window.open(asset.content, "_blank")}
                          className="icon-button"
                        >
                          <LinkIcon />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">0</TableCell>
                  <TableCell className="text-center">
                    <button
                      className="icon-button inline-flex items-center justify-center w-full"
                      onClick={() => {
                        handleEdit(asset);
                      }}
                    >
                      <PencilIcon />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      className="icon-button inline-flex items-center justify-center w-full"
                      onClick={() => {
                        setAssetToDelete(asset);
                        setConfirmDeleteOpen(true);
                      }}
                    >
                      <TrashIcon className="text-red-500" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {!loading && totalElements > 0 && (
        <CardFooter className="flex justify-between items-center w-full">
          <span className="page-info">
            Mostrando {rangeStart}–{rangeEnd} de {totalElements} ativos
          </span>

          <div className="flex items-center gap-1">
            <button
              className="page-button-nav flex items-center gap-1"
              onClick={() => void loadAssets(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeftIcon /> Anterior
            </button>

            {(() => {
              const pages: (number | string)[] = [];

              if (displayTotalPages <= 5) {
                for (let i = 1; i <= displayTotalPages; i++) pages.push(i);
              } else if (displayPage <= 3) {
                pages.push(1, 2, 3, "...", displayTotalPages);
              } else if (displayPage >= displayTotalPages - 2) {
                pages.push(
                  1,
                  "...",
                  displayTotalPages - 2,
                  displayTotalPages - 1,
                  displayTotalPages,
                );
              } else {
                pages.push(1, "...", displayPage, "...", displayTotalPages);
              }

              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="page-dots">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`page-button ${p === displayPage ? "page-button-active" : ""}`}
                    onClick={() => void loadAssets((p as number) - 1)}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              className="page-button-nav flex items-center gap-1"
              onClick={() => void loadAssets(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Próximo <ChevronRightIcon />
            </button>
          </div>
        </CardFooter>
      )}

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
            await handleDelete(assetToDelete.id); // Aguarda a requisição terminar
          }
          setConfirmDeleteOpen(false); // Fecha o modal
          setAssetToDelete(null); // Limpa o estado
        }}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAssetToDelete(null);
        }}
        loading={deleting}
      />
    </Card>
  );
}