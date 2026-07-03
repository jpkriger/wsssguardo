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
import { getProjectConfiguration } from "@/api/projectConfiguration";
import RiskModal, {
  type RiskModalSubmitData,
  type RiskModalRisk,
  type RiskModalOption,
} from "../RiskModal/RiskModal";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";
import { formatDateTime } from "@/lib/format-date";
import { formatProbability } from "../RiskExpandedContent/format";
import RiskExpandedContent from "../RiskExpandedContent/RiskExpandedContent";
import { priorityConfig } from "@/lib/priority";

const PAGE_SIZE = 5;

/** Falls back to the backend's default RiskConfig scale (0–10) until the project's real configuration loads. */
const DEFAULT_DAMAGE_RANGE = { min: 0, max: 10 };

// ── Helpers ──────────────────────────────────────────────────────────

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
  const probabilityRange = {
    min: 0,
    max: 100,
  };
  const [damageRange, setDamageRange] = useState(DEFAULT_DAMAGE_RANGE);

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

  const loadDamageRange = useCallback(async () => {
    try {
      const config = await getProjectConfiguration(projectId);
      const { minRange, maxRange } = config.riskConfig;
      if (minRange != null && maxRange != null) {
        setDamageRange({ min: minRange, max: maxRange });
      }
    } catch {
      setDamageRange(DEFAULT_DAMAGE_RANGE);
    }
  }, [projectId]);

  useEffect(() => {
    void loadRisks();
    void loadFindings();
    void loadDamageRange();
  }, [loadRisks, loadFindings, loadDamageRange]);

  async function handleDelete(id: string): Promise<void> {
    setDeleting(true);
    try {
      await deleteRisk(projectId, id);
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
      damageAssets: risk.damageAssets,
      recommendation: risk.recommendation,
      priority: risk.priority,
      findIds: risk.findIds,
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
        await createRisk(projectId, {
          name: data.name,
          findIds: data.findIds,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: data.occurrenceProbability,
          impactProbability: data.impactProbability,
          damageOperations: data.damageOperations,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          damageAssets: data.damageAssets,
          recommendation: data.recommendation,
          priority: data.priority,
        });
      } else if (modalMode === "edit" && data.id) {
        await updateRisk(projectId, data.id, {
          name: data.name,
          description: data.description,
          consequences: data.consequences,
          occurrenceProbability: data.occurrenceProbability,
          impactProbability: data.impactProbability,
          damageOperations: data.damageOperations,
          findIds: data.findIds,
          damageIndividuals: data.damageIndividuals,
          damageOtherOrgs: data.damageOtherOrgs,
          damageAssets: data.damageAssets,
          recommendation: data.recommendation,
          priority: data.priority,
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
            {truncateText(risk.name, 40)}
          </span>
        ),
      },
      {
        id: "priority",
        label: "Prioridade",
        getSortValue: (r) => r.priority,
        renderCell: (risk) => {
          const config = priorityConfig[risk.priority] ?? priorityConfig.P3;
          return (
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        id: "description",
        label: "Impacto direto ao negócio",
        getSortValue: (r) => r.description,
        renderCell: (risk) => (
          <span className="text-sm text-foreground">
            {truncateText(risk.description, 50)}
          </span>
        ),
      },
      {
        id: "consequences",
        label: "Consequências",
        renderCell: (risk) => (
          <span className="text-sm text-muted-foreground">
            {truncateText(risk.consequences, 50)}
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
        id: "createdBy",
        label: "Criado por",
        getSortValue: (r) => r.createdBy,
        renderCell: (risk) => (
          <span className="text-sm text-foreground whitespace-nowrap">
            {risk.createdBy ?? "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        label: "Data de criação",
        dataType: "date",
        getSortValue: (r) => r.createdAt,
        renderCell: (risk) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTime(risk.createdAt)}
          </span>
        ),
      },
      {
        id: "updatedAt",
        label: "Última alteração",
        dataType: "date",
        getSortValue: (r) => r.updatedAt ?? r.createdAt,
        renderCell: (risk) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTime(risk.updatedAt ?? risk.createdAt)}
          </span>
        ),
      },
    ],
    [],
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
            id: "priority",
            label: "Prioridade",
            type: "select",
            getValue: (r) => priorityConfig[r.priority]?.label ?? r.priority,
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
            projectId={projectId}
            probabilityMax={probabilityRange.max}
            findings={findings}
            onEdit={handleEdit}
            onDelete={(r) => {
              setRiskToDelete(r);
              setConfirmDeleteOpen(true);
            }}
            onUpdateRisk={(fields) => {
              setRisks((prev) =>
                prev.map((r) => (r.id === risk.id ? { ...r, ...fields } : r)),
              );
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
        damageRange={damageRange}
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
