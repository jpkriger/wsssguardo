import { useState, useEffect, useCallback, type ReactElement } from "react";
import "./AssetTable.css";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { toast } from "sonner";

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
  const [assetToDelete, setAssetToDelete] = useState<AssetResponse | null>(
    null,
  );
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

  const displayPage = page + 1;
  const displayTotalPages = totalPages;
  const rangeStart = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <Card className="py-0 gap-0 ">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 px-8 pt-6 pb-3">
        <div>
          <h2 className="text-2xl font-normal text-foreground leading-tight">
            Ativos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ativos registrados e vinculados ao escopo da avaliação
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border-none cursor-pointer flex-shrink-0"
          onClick={handleCreate}
        >
          <PlusIcon className="h-4 w-4" /> Novo Ativo
        </button>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0">
        {error && <p className="text-destructive text-sm px-8 pb-4">{error}</p>}

        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: "calc(5 * 45px)" }}
          >
            <LoaderCircleIcon className="animate-spin text-muted-foreground h-6 w-6" />
          </div>
        ) : assets.length === 0 ? (
          <p
            className="text-muted-foreground text-sm text-center flex items-center justify-center"
            style={{ minHeight: "calc(5 * 45px)" }}
          >
            Nenhum ativo encontrado.
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            style={{ minHeight: "calc(5 * 45px + 48px)" }}
          >
            <div
              style={{ minHeight: "calc(5 * 45px + 48px)" }}
              className="flex flex-col justify-start"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5 py-3 text-left text-lg font-normal text-foreground w-[18%]">
                      Ativo
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-lg font-normal text-foreground w-[32%]">
                      Descrição
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-lg font-normal text-foreground w-[20%]">
                      Referência
                    </TableHead>
                    <TableHead className="px-5 py-3 text-center text-lg font-normal text-foreground w-[18%]">
                      Achados ligados
                    </TableHead>
                    <TableHead className="w-[4%]"></TableHead>
                    <TableHead className="w-[4%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="border-t-2 border-border"
                    >
                      <TableCell className="px-5 py-2.5 text-sm text-foreground">
                        {asset.name}
                      </TableCell>
                      <TableCell className="px-5 py-2.5 text-sm text-muted-foreground align-top">
                        {asset.description}
                      </TableCell>
                      <TableCell className="px-5 py-2.5">
                        <div className="ref-cell">
                          <span className="ref-cell-text text-sm">
                            {asset.content && asset.content.length > 20
                              ? `${asset.content.slice(0, 20)}…`
                              : (asset.content ?? "—")}
                          </span>
                          {asset.content && (
                            <button
                              onClick={() =>
                                window.open(asset.content, "_blank")
                              }
                              className="icon-button"
                            >
                              <LinkIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-2.5 text-sm text-center">
                        0
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-center">
                        <button
                          className="icon-button inline-flex items-center justify-center"
                          onClick={() => handleEdit(asset)}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-center">
                        <button
                          className="icon-button inline-flex items-center justify-center"
                          onClick={() => {
                            setAssetToDelete(asset);
                            setConfirmDeleteOpen(true);
                          }}
                        >
                          <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      {!loading && totalElements > 0 && (
        <CardFooter className="flex justify-between items-center w-full px-8 py-5">
          <span className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {totalElements} ativos
          </span>

          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => void loadAssets(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeftIcon className="h-4 w-4" /> Anterior
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
                  <span
                    key={`dots-${i}`}
                    className="px-1 text-muted-foreground text-sm"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`w-8 h-8 rounded-md text-sm transition-colors
              ${
                p === displayPage
                  ? "text-foreground font-semibold border border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
                    onClick={() => void loadAssets((p as number) - 1)}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => void loadAssets(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Próximo <ChevronRightIcon className="h-4 w-4" />
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
