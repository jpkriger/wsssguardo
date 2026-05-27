import { Fragment, useState, useEffect, useCallback, useMemo, type ReactElement } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import {
  fetchRisksByProject,
  deleteRisk,
  createRisk,
  updateRisk,
  type RiskResponse,
} from "@/api/risk";
import { listFindings, type FindingResponse } from "@/api/finding";
import {
  getProjectConfiguration,
  type RiskCategoryDTO,
} from "@/api/projectConfiguration";
import { GenericTable, type ColumnDefinition } from "../GenericTable";
import type { ColumnConfig } from "@/hooks/use-table-columns";
import RiskModal, {
  type RiskModalSubmitData,
  type RiskModalRisk,
  type RiskModalOption,
} from "../RiskModal/RiskModal";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { toast } from "sonner";

const PAGE_SIZE = 5;

// ── Utility Functions ────────────────────────────────────────────

type RiskLevelLabel = "Alta" | "Média" | "Baixa";

interface RiskLevelConfig {
  label: RiskLevelLabel;
  className: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  default: "bg-green-600 text-white",
};

const RISK_LEVEL_FALLBACK: RiskLevelConfig = {
  label: "Baixa",
  className: "bg-green-600 text-white",
};

function categoryClassName(index: number, total: number): string {
  if (index === total - 1) return "bg-red-600 text-white";
  if (index === total - 2) return "bg-yellow-500 text-white";
  return CATEGORY_STYLES.default;
}

function buildGetRiskLevelConfig(
  categories: RiskCategoryDTO[]
): (riskLevel: number | null | undefined) => RiskLevelConfig {
  const sorted = [...categories].sort((a, b) => a.minRange - b.minRange);
  return (riskLevel) => {
    if (riskLevel == null) return RISK_LEVEL_FALLBACK;
    const idx = sorted.findIndex(
      (c) => riskLevel >= c.minRange && riskLevel <= c.maxRange
    );
    if (idx === -1) return RISK_LEVEL_FALLBACK;
    return {
      label: sorted[idx].label as RiskLevelLabel,
      className: categoryClassName(idx, sorted.length),
    };
  };
}

function formatProbability(value: number | null | undefined, max = 100): string {
  if (value == null) return "—";
  return `${Math.round((value / max) * 100)}%`;
}

function truncateText(text: string | null | undefined, maxLen: number): string {
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

// ── Component ────────────────────────────────────────────────────

export default function RiskTableRefactored(): ReactElement {
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
  const [riskCategories, setRiskCategories] = useState<RiskCategoryDTO[]>([
    { label: "Baixo", minRange: 0, maxRange: 32 },
    { label: "Médio", minRange: 33, maxRange: 65 },
    { label: "Alto", minRange: 66, maxRange: 100 },
  ]);
  const [probabilityRange, setProbabilityRange] = useState({
    min: 0,
    max: 100,
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<RiskResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load data
  const loadRisks = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRisksByProject(projectId, targetPage, PAGE_SIZE);
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
    [projectId]
  );

  const loadFindings = useCallback(async () => {
    try {
      const data: FindingResponse[] = await listFindings(projectId);
      setFindings(
        data.map((f) => ({
          id: f.id,
          label: f.name,
          description: f.description,
        }))
      );
    } catch {
      setFindings([]);
    }
  }, [projectId]);

  const loadConfiguration = useCallback(async () => {
    try {
      const config = await getProjectConfiguration(projectId);
      if (config.riskConfig.categories.length > 0) {
        setRiskCategories(config.riskConfig.categories);
      }
      setProbabilityRange({
        min: config.riskConfig.minRange,
        max: config.riskConfig.maxRange,
      });
    } catch {
      // fallback mantido no estado inicial
    }
  }, [projectId]);

  useEffect(() => {
    void loadRisks(0);
    void loadFindings();
    void loadConfiguration();
  }, [loadRisks, loadFindings, loadConfiguration]);

  const getRiskLevelConfig = useMemo(
    () => buildGetRiskLevelConfig(riskCategories),
    [riskCategories]
  );

  // Column definitions
  const columns: ColumnDefinition<RiskResponse>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nome",
        dataType: "text",
        isRequired: true,
        renderCell: (risk) => truncateText(risk.name, 28),
        getSortValue: (risk) => risk.name || "",
        cellClassName: "px-5 py-2.5 text-sm text-foreground font-medium",
      },
      {
        id: "description",
        label: "Impacto ao Negócio",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.description, 28),
        getSortValue: (risk) => risk.description || "",
        cellClassName: "px-5 py-2.5 text-sm text-foreground",
      },
      {
        id: "consequences",
        label: "Consequências",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.consequences, 28),
        getSortValue: (risk) => risk.consequences || "",
        cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
      },
      {
        id: "occurrenceProbability",
        label: "Prob. Ocorrência",
        dataType: "number",
        renderCell: (risk) =>
          formatProbability(risk.occurrenceProbability, probabilityRange.max),
        getSortValue: (risk) => risk.occurrenceProbability ?? 0,
        cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
        headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground cursor-pointer hover:bg-accent",
      },
      {
        id: "impactProbability",
        label: "Prob. Impacto",
        dataType: "number",
        renderCell: (risk) =>
          formatProbability(risk.impactProbability, probabilityRange.max),
        getSortValue: (risk) => risk.impactProbability ?? 0,
        cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
        headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground cursor-pointer hover:bg-accent",
      },
      {
        id: "damageOperations",
        label: "Danos - Operações",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.damageOperations, 28),
        getSortValue: (risk) => risk.damageOperations || "",
        cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
      },
      {
        id: "damageIndividuals",
        label: "Danos - Indivíduos",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.damageIndividuals, 28),
        getSortValue: (risk) => risk.damageIndividuals || "",
        cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
      },
      {
        id: "damageOtherOrgs",
        label: "Danos - Outras Orgs",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.damageOtherOrgs, 28),
        getSortValue: (risk) => risk.damageOtherOrgs || "",
        cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
      },
      {
        id: "recommendation",
        label: "Recomendação",
        dataType: "text",
        renderCell: (risk) => truncateText(risk.recommendation, 28),
        getSortValue: (risk) => risk.recommendation || "",
        cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
      },
      {
        id: "riskLevel",
        label: "Nível de Risco",
        dataType: "enum",
        renderCell: (risk) => {
          const levelConfig = getRiskLevelConfig(risk.riskLevel);
          return (
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${levelConfig.className}`}
            >
              {levelConfig.label}
            </span>
          );
        },
        getSortValue: (risk) => risk.riskLevel ?? 0,
        cellClassName: "px-5 py-2.5 text-center",
        headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground cursor-pointer hover:bg-accent",
      },
    ],
    [getRiskLevelConfig, probabilityRange.max]
  );

  // Default column visibility
  const defaultColumnConfig: ColumnConfig = useMemo(
    () => Object.fromEntries(columns.map((col, idx) => [col.id, idx < 6])),
    [columns]
  );

  // Modal handlers
  function handleCreateRisk(): void {
    setSelectedRisk(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleEditRisk(risk: RiskResponse): void {
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
      findingIds: risk.findingIds,
    });
    setModalMode("edit");
    setModalOpen(true);
  }

  async function handleSubmit(data: RiskModalSubmitData): Promise<void> {
    setModalLoading(true);
    setError(null);
    try {
      if (modalMode === "create") {
        const createData = {
          projectId,
          name: data.name,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: data.occurrenceProbability,
          impactProbability: data.impactProbability,
          damageOperations: data.damageOperations,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          recommendation: data.recommendation,
          findingIds: data.findingIds,
        };
        await createRisk(createData);
      } else if (modalMode === "edit" && data.id) {
        const updateData = {
          name: data.name,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: data.occurrenceProbability,
          impactProbability: data.impactProbability,
          damageOperations: data.damageOperations,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          recommendation: data.recommendation,
          findingIds: data.findingIds,
        };
        await updateRisk(data.id, updateData);
      }
      setModalOpen(false);
      await loadRisks(page);
      toast.success(
        modalMode === "create"
          ? "Risco criado com sucesso."
          : "Risco atualizado com sucesso."
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(
        modalMode === "create"
          ? "Falha ao criar risco."
          : "Falha ao atualizar risco."
      );
      console.error(message);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteRisk(risk: RiskResponse): Promise<void> {
    setDeleting(true);
    try {
      await deleteRisk(risk.id);
      const isLastItemOnPage = risks.length === 1;
      const isNotFirstPage = page > 0;

      if (isLastItemOnPage && isNotFirstPage) {
        await loadRisks(page - 1);
      } else {
        await loadRisks(page);
      }
      setError(null);
      toast.success("Risco excluído com sucesso.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Falha ao excluir risco.");
      console.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Fragment>
      <GenericTable<RiskResponse>
        tableId="risk-table"
        data={risks}
        columns={columns}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={PAGE_SIZE}
        isLoading={loading}
        error={error}
        onPageChange={(newPage) => {
          void loadRisks(newPage);
        }}
        defaultColumnConfig={defaultColumnConfig}
        title="Riscos"
        subtitle="Riscos registrados e vinculados ao escopo da avaliação"
        primaryAction={{
          label: "Novo Risco",
          icon: PlusIcon,
          onClick: handleCreateRisk,
        }}
        rowActions={[
          {
            icon: PencilIcon,
            label: "Editar",
            onClick: (risk) => handleEditRisk(risk),
          },
          {
            icon: TrashIcon,
            label: "Deletar",
            variant: "destructive",
            onClick: (risk) => {
              setRiskToDelete(risk);
              setConfirmDeleteOpen(true);
            },
          },
        ]}
        enableSorting
        enableSearch
        enableColumnToggle
      />

      <RiskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        risk={selectedRisk}
        findings={findings}
        riskCategories={riskCategories}
        probabilityRange={probabilityRange}
        loading={modalLoading}
        onSubmit={(data) => {
          void handleSubmit(data);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Excluir Risco"
        description={`Tem certeza que deseja excluir o risco "${riskToDelete?.name}"?`}
        onConfirm={() => {
          if (riskToDelete) {
            void handleDeleteRisk(riskToDelete);
            void setConfirmDeleteOpen(false);
          }
        }}
        confirmText="Excluir"
        confirmVariant="destructive"
        loading={deleting}
      />
    </Fragment>
  );
}
