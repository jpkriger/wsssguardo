import { Fragment, useState, useEffect, useCallback, useMemo, type ReactElement } from "react";
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
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PencilIcon,
  LoaderCircleIcon,
  PlusIcon,
} from "lucide-react";

import { useProject } from "@/contexts/ProjectContext";
import {
  fetchRisksByProject,
  deleteRisk,
  createRisk,
  updateRisk,
  type RiskResponse,
} from "@/api/risk";
import { listFindings, type FindingResponse } from "@/api/finding";
import RiskModal, {
  type RiskModalSubmitData,
  type RiskModalRisk,
  type RiskModalOption,
} from "../RiskModal/RiskModal";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import ColumnVisibilityDropdown from "../ColumnVisibilityToggle/ColumnVisibilityDropdown";
import { useTableColumns, type ColumnConfig } from "@/hooks/use-table-columns";

const PAGE_SIZE = 5;

// ── Column definitions ──────────────────────────────────────────────

interface RiskColumnDef {
  id: string;
  label: string;
  headClassName: string;
  cellClassName: string;
  renderContent: (risk: RiskResponse, levelConfig: RiskLevelConfig) => ReactElement | string;
}

type RiskLevelLabel = "Alta" | "Média" | "Baixa";

interface RiskLevelConfig {
  label: RiskLevelLabel;
  className: string;
}

function getRiskLevelConfig(riskLevel: number | null | undefined): RiskLevelConfig {
  if (riskLevel == null) {
    return { label: "Baixa", className: "bg-green-600 text-white" };
  }
  if (riskLevel >= 66) {
    return { label: "Alta", className: "bg-red-600 text-white" };
  }
  if (riskLevel >= 33) {
    return { label: "Média", className: "bg-yellow-500 text-white" };
  }
  return { label: "Baixa", className: "bg-green-600 text-white" };
}

function formatProbability(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

function truncateText(text: string | null | undefined, maxLen: number): string {
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

const ALL_COLUMNS: RiskColumnDef[] = [
  {
    id: "description",
    label: "Descrição",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-foreground",
    renderContent: (risk) => truncateText(risk.description, 28),
  },
  {
    id: "consequences",
    label: "Consequências",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    renderContent: (risk) => truncateText(risk.consequences, 28),
  },
  {
    id: "occurrenceProbability",
    label: "Prob. Ocorrência",
    headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
    renderContent: (risk) => formatProbability(risk.occurrenceProbability),
  },
  {
    id: "impactProbability",
    label: "Prob. Impacto",
    headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
    renderContent: (risk) => formatProbability(risk.impactProbability),
  },
  {
    id: "recommendation",
    label: "Recomendação",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    renderContent: (risk) => truncateText(risk.recommendation, 28),
  },
  {
    id: "riskLevel",
    label: "Nível de Risco",
    headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-center",
    renderContent: (_risk, levelConfig) => (
      <span
        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${levelConfig.className}`}
      >
        {levelConfig.label}
      </span>
    ),
  },
  {
    id: "name",
    label: "Nome",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-foreground font-medium",
    renderContent: (risk) => truncateText(risk.name, 28),
  },
  {
    id: "damageOperations",
    label: "Danos Operações",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    renderContent: (risk) => truncateText(risk.damageOperations, 28),
  },
  {
    id: "damageIndividuals",
    label: "Danos Indivíduos",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    renderContent: (risk) => truncateText(risk.damageIndividuals, 28),
  },
  {
    id: "damageOtherOrgs",
    label: "Danos Outras Orgs",
    headClassName: "px-5 py-3 text-left text-lg font-normal text-foreground",
    cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    renderContent: (risk) => truncateText(risk.damageOtherOrgs, 28),
  },
];

const COLUMN_MENU_ITEMS = ALL_COLUMNS.map((c) => ({ id: c.id, label: c.label }));

/** First 6 columns are visible by default (matches the screenshot layout). */
const DEFAULT_COLUMN_CONFIG: ColumnConfig = Object.fromEntries(
  ALL_COLUMNS.map((col, idx) => [col.id, idx < 6]),
);

// ── Component ────────────────────────────────────────────────────────

export default function RiskTable(): ReactElement {
  const { projectId } = useProject();

  const [risks, setRisks] = useState<RiskResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedRisk, setSelectedRisk] = useState<RiskModalRisk | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [findings, setFindings] = useState<RiskModalOption[]>([]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<RiskResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { visibleColumns, toggleColumn, resetColumns } = useTableColumns(
    "risk-table",
    DEFAULT_COLUMN_CONFIG,
  );

  /** Only render columns that are toggled on. */
  const activeColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => visibleColumns[col.id]),
    [visibleColumns],
  );

  const loadRisks = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRisksByProject(
          projectId,
          targetPage,
          PAGE_SIZE,
        );
        setRisks(data.content);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar riscos";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const loadFindings = useCallback(async () => {
    try {
      const data: FindingResponse[] = await listFindings(projectId);
      setFindings(
        data.map((f) => ({
          id: f.id,
          label: f.name,
          description: f.description,
        })),
      );
    } catch {
      // Non-blocking: findings are optional for the table
      setFindings([]);
    }
  }, [projectId]);

  useEffect(() => {
    void loadRisks(0);
    void loadFindings();
  }, [loadRisks, loadFindings]);

  async function handleDelete(id: string): Promise<void> {
    setDeleting(true);
    try {
      await deleteRisk(id);

      const isLastItemOnPage = risks.length === 1;
      const isNotFirstPage = page > 0;

      if (isLastItemOnPage && isNotFirstPage) {
        await loadRisks(page - 1);
      } else {
        await loadRisks(page);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir risco";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(risk: RiskResponse): void {
    setSelectedRisk({
      id: risk.id,
      name: risk.name,
      description: risk.description,
      consequences: risk.consequences,
      occurrenceProbability: risk.occurrenceProbability,
      impactProbability: risk.impactProbability,
      damageOperations: risk.damageOperations,
      damageIndividuals: risk.damageIndividuals,
      damageOtherOrgs: risk.damageOtherOrgs,
      recommendation: risk.recommendation,
      riskLevel: risk.riskLevel,
      findIds: risk.findIds,
      damageAssetIds: risk.damageAssetIds,
    });
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleCreate(): void {
    setSelectedRisk(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleSubmit(data: RiskModalSubmitData): Promise<void> {
    setModalLoading(true);
    setError(null);
    try {
      if (modalMode === "create") {
        const occurrenceP = data.occurrenceProbability;
        const impactP = data.impactProbability;
        const riskLevel = Math.round(occurrenceP * impactP * 100);

        await createRisk({
          projectId,
          name: data.name,
          findIds: data.findIds,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: occurrenceP,
          impactProbability: impactP,
          damageOperations: data.damageOperations,
          damageAssetIds: data.damageAssetIds,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          recommendation: data.recommendation,
          riskLevel,
        });
      } else if (modalMode === "edit" && data.id) {
        const occurrenceP = data.occurrenceProbability;
        const impactP = data.impactProbability;
        const riskLevel = Math.round(occurrenceP * impactP * 100);

        await updateRisk(data.id, {
          name: data.name,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: occurrenceP,
          impactProbability: impactP,
          damageOperations: data.damageOperations,
          findIds: data.findIds,
          assetIds: data.damageAssetIds,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          recommendation: data.recommendation,
          riskLevel,
        });
      }
      setModalOpen(false);
      await loadRisks(page);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar risco";
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
    <Card className="py-0 gap-0">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 px-8 pt-6 pb-3">
        <div>
          <h2 className="text-2xl font-normal text-foreground leading-tight">
            Riscos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Riscos identificados e vinculados ao escopo da avaliação
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ColumnVisibilityDropdown
            columns={COLUMN_MENU_ITEMS}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onReset={resetColumns}
            label="Colunas"
          />
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity outline-none border-none cursor-pointer"
            onClick={handleCreate}
          >
            <PlusIcon className="h-4 w-4" /> Adicionar risco
          </button>
        </div>
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
        ) : risks.length === 0 ? (
          <p
            className="text-muted-foreground text-sm text-center flex items-center justify-center"
            style={{ minHeight: "calc(5 * 45px)" }}
          >
            Nenhum risco encontrado.
          </p>
        ) : (
          <div
            className="overflow-hidden"
            style={{ minHeight: "calc(5 * 45px + 48px)" }}
          >
            <div
              style={{ minHeight: "calc(5 * 45px + 48px)" }}
              className="flex flex-col justify-start"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 px-4 py-3" aria-label="Expandir" />
                    {activeColumns.map((col) => (
                      <TableHead key={col.id} className={col.headClassName}>
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[4%]"></TableHead>
                    <TableHead className="w-[4%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => {
                    const levelConfig = getRiskLevelConfig(risk.riskLevel);
                    const isExpanded = expandedId === risk.id;
                    const totalColSpan = activeColumns.length + 3;
                    return (
                      <Fragment key={risk.id}>
                        <TableRow
                          className={`border-t-2 border-border transition-colors ${
                            isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                          }`}
                        >
                          <TableCell className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-sm leading-none p-1"
                              onClick={() =>
                                setExpandedId((prev) =>
                                  prev === risk.id ? null : risk.id,
                                )
                              }
                              aria-label={
                                isExpanded ? "Recolher" : "Expandir"
                              }
                            >
                              {isExpanded ? "▴" : "▾"}
                            </button>
                          </TableCell>
                          {activeColumns.map((col) => (
                            <TableCell
                              key={col.id}
                              className={col.cellClassName}
                            >
                              {col.renderContent(risk, levelConfig)}
                            </TableCell>
                          ))}
                          <TableCell className="px-3 py-2.5 text-center">
                            <button
                              className="bg-transparent border-none cursor-pointer text-sm p-1 opacity-80 hover:opacity-100 transition-opacity inline-flex items-center justify-center"
                              onClick={() => handleEdit(risk)}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center">
                            <button
                              className="bg-transparent border-none cursor-pointer text-sm p-1 opacity-80 hover:opacity-100 transition-opacity inline-flex items-center justify-center"
                              onClick={() => {
                                setRiskToDelete(risk);
                                setConfirmDeleteOpen(true);
                              }}
                            >
                              <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="border-t border-border bg-muted/10">
                            <TableCell colSpan={totalColSpan} className="px-8 py-4">
                              <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                  {risk.name && (
                                    <div className="col-span-1 md:col-span-2">
                                      <span className="text-muted-foreground">Nome: </span>
                                      <span className="text-foreground font-medium">{risk.name}</span>
                                    </div>
                                  )}
                                  {risk.description && (
                                    <div className="col-span-1 md:col-span-2">
                                      <span className="text-muted-foreground">Descrição: </span>
                                      <span className="text-foreground">{risk.description}</span>
                                    </div>
                                  )}
                                  {risk.consequences && (
                                    <div className="col-span-1 md:col-span-2">
                                      <span className="text-muted-foreground">Consequências: </span>
                                      <span className="text-foreground">{risk.consequences}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Prob. Ocorrência: </span>
                                    <span className="text-foreground">{formatProbability(risk.occurrenceProbability)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Prob. Impacto: </span>
                                    <span className="text-foreground">{formatProbability(risk.impactProbability)}</span>
                                  </div>
                                  {risk.damageOperations && (
                                    <div>
                                      <span className="text-muted-foreground">Danos Operações: </span>
                                      <span className="text-foreground">{risk.damageOperations}</span>
                                    </div>
                                  )}
                                  {risk.damageIndividuals && (
                                    <div>
                                      <span className="text-muted-foreground">Danos Indivíduos: </span>
                                      <span className="text-foreground">{risk.damageIndividuals}</span>
                                    </div>
                                  )}
                                  {risk.damageOtherOrgs && (
                                    <div>
                                      <span className="text-muted-foreground">Danos Outras Orgs: </span>
                                      <span className="text-foreground">{risk.damageOtherOrgs}</span>
                                    </div>
                                  )}
                                  {risk.recommendation && (
                                    <div className="col-span-1 md:col-span-2">
                                      <span className="text-muted-foreground">Recomendação: </span>
                                      <span className="text-foreground">{risk.recommendation}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Nível de Risco: </span>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${levelConfig.className}`}
                                    >
                                      {levelConfig.label}
                                    </span>
                                    {risk.riskLevel != null && (
                                      <span className="text-muted-foreground ml-1">({risk.riskLevel})</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Achados vinculados: </span>
                                    <span className="text-foreground">{risk.findIds?.length ?? 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Ativos afetados: </span>
                                    <span className="text-foreground">{risk.damageAssetIds?.length ?? 0}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer"
                                    onClick={() => handleEdit(risk)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors bg-transparent cursor-pointer"
                                    onClick={() => {
                                      setRiskToDelete(risk);
                                      setConfirmDeleteOpen(true);
                                    }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      {!loading && totalElements > 0 && (
        <CardFooter className="flex justify-between items-center w-full px-8 py-5">
          <span className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {totalElements} riscos
          </span>

          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => void loadRisks(page - 1)}
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
                    onClick={() => void loadRisks((p as number) - 1)}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => void loadRisks(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Próximo <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </CardFooter>
      )}

      <RiskModal
        open={modalOpen}
        loading={modalLoading}
        mode={modalMode}
        risk={selectedRisk}
        findings={findings}
        projectId={projectId}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          void handleSubmit(data);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o risco "${riskToDelete?.name ?? ""}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={async () => {
          if (riskToDelete) {
            await handleDelete(riskToDelete.id);
          }
          setConfirmDeleteOpen(false);
          setRiskToDelete(null);
        }}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setRiskToDelete(null);
        }}
        loading={deleting}
      />
    </Card>
  );
}
