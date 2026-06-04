import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactElement,
} from "react";
import { PlusIcon } from "lucide-react";

import { useProject } from "@/contexts/ProjectContext";
import {
  fetchAllRisksByProject,
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
import RiskModal, {
  type RiskModalSubmitData,
  type RiskModalRisk,
  type RiskModalOption,
} from "../RiskModal/RiskModal";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";
import RiskExpandedContent from "../RiskExpandedContent/RiskExpandedContent";
import { formatProbability } from "../RiskExpandedContent/format";

const PAGE_SIZE = 5;

// ── Helpers ──────────────────────────────────────────────────────────

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
  categories: RiskCategoryDTO[],
): (riskLevel: number | null | undefined) => RiskLevelConfig {
  const sorted = [...categories].sort((a, b) => a.minRange - b.minRange);
  return (riskLevel) => {
    if (riskLevel == null) return RISK_LEVEL_FALLBACK;
    const idx = sorted.findIndex(
      (c) => riskLevel >= c.minRange && riskLevel <= c.maxRange,
    );
    if (idx === -1) return RISK_LEVEL_FALLBACK;
    return {
      label: sorted[idx].label as RiskLevelLabel,
      className: categoryClassName(idx, sorted.length),
    };
  };
}

function truncateText(text: string | null | undefined, maxLen: number): string {
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

// ── Component ────────────────────────────────────────────────────────

export default function RiskTable(): ReactElement {
  const { projectId } = useProject();

  const [risks, setRisks] = useState<RiskResponse[]>([]);
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

  const loadRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRisks(await fetchAllRisksByProject(projectId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar riscos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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

  const getRiskLevelConfig = useMemo(
    () => buildGetRiskLevelConfig(riskCategories),
    [riskCategories],
  );

  useEffect(() => {
    void loadRisks();
    void loadFindings();
    void loadConfiguration();
  }, [loadRisks, loadFindings, loadConfiguration]);

  async function handleDelete(id: string): Promise<void> {
    setDeleting(true);
    try {
      await deleteRisk(id);
      setRisks((prev) => prev.filter((r) => r.id !== id));
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
        const riskLevel = Math.round(
          (occurrenceP * impactP) / probabilityRange.max,
        );

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
        const riskLevel = Math.round(
          (occurrenceP * impactP) / probabilityRange.max,
        );

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
      await loadRisks();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar risco";
      setError(message);
    } finally {
      setModalLoading(false);
    }
  }

  const columns: ColumnDefinition<RiskResponse>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Nome",
        getSortValue: (r) => r.name,
        isRequired: true,
        renderCell: (risk) => (
          <span className="text-sm text-foreground font-medium">
            {truncateText(risk.name, 28)}
          </span>
        ),
      },
      {
        id: "description",
        label: "Impacto direto ao negócio",
        getSortValue: (r) => r.description,
        renderCell: (risk) => (
          <span className="text-sm text-foreground">
            {truncateText(risk.description, 28)}
          </span>
        ),
      },
      {
        id: "consequences",
        label: "Consequências",
        renderCell: (risk) => (
          <span className="text-sm text-muted-foreground">
            {truncateText(risk.consequences, 28)}
          </span>
        ),
      },
      {
        id: "occurrenceProbability",
        label: "Prob. Ocorrência",
        renderCell: (risk) => (
          <span className="text-sm text-center block text-foreground">
            {formatProbability(
              risk.occurrenceProbability,
              probabilityRange.max,
            )}
          </span>
        ),
      },
      {
        id: "impactProbability",
        label: "Prob. Impacto",
        renderCell: (risk) => (
          <span className="text-sm text-center block text-foreground">
            {formatProbability(risk.impactProbability, probabilityRange.max)}
          </span>
        ),
      },
      {
        id: "riskLevel",
        label: "Nível de Risco",
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
      },
    ],
    [getRiskLevelConfig, probabilityRange.max],
  );

  return (
    <>
      <GenericTable
        tableId="risk-table"
        data={risks}
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
            getValue: (r) => r.createdBy,
          },
          {
            id: "createdAt",
            label: "Data de criação",
            type: "dateRange",
            getValue: (r) => r.createdAt,
          },
        ]}
        title="Riscos"
        subtitle="Riscos identificados e vinculados ao escopo da avaliação"
        primaryAction={{
          label: "Adicionar risco",
          icon: PlusIcon,
          onClick: handleCreate,
        }}
        enableSorting
        enableColumnToggle
        expandableContent={(risk) => (
          <RiskExpandedContent
            risk={risk}
            levelConfig={getRiskLevelConfig(risk.riskLevel)}
            probabilityMax={probabilityRange.max}
            findings={findings}
            onEdit={handleEdit}
            onDelete={(r) => {
              setRiskToDelete(r);
              setConfirmDeleteOpen(true);
            }}
          />
        )}
      />

      <RiskModal
        open={modalOpen}
        loading={modalLoading}
        mode={modalMode}
        risk={selectedRisk}
        findings={findings}
        probabilityRange={probabilityRange}
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
    </>
  );
}
