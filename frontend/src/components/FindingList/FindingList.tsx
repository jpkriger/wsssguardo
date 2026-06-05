import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Plus } from "lucide-react";
import {
  listFindings,
  deleteFinding,
  createFinding,
  updateFinding,
  type FindingResponse,
  type FindingSeverity,
} from "../../api/finding";
import FindingModal, {
  type FindingModalSubmitData,
} from "../FindingModal/FindingModal";
import CategoryFilter from "../CategoryFilter/CategoryFilter";
import GenericTable from "../GenericTable/GenericTable";
import type { ColumnDefinition } from "../GenericTable/types";

const PAGE_SIZE = 5;

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
  INFO: "Info",
};

const SEVERITY_BADGE: Record<FindingSeverity, string> = {
  CRITICAL: "bg-red-700 text-white",
  HIGH: "bg-red-600 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-green-600 text-white",
  INFO: "bg-blue-500 text-white",
};

interface FindingListProps {
  projectId: string;
}

export default function FindingList({ projectId }: FindingListProps): ReactElement {
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryConfig, setCategoryConfig] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalFinding, setModalFinding] = useState<FindingResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setFindings(await listFindings(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar achados");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await deleteFinding(projectId, id);
      setFindings((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir achado");
    }
  }

  async function handleModalSubmit(data: FindingModalSubmitData): Promise<void> {
    setModalLoading(true);
    try {
      if (data.id) {
        const updated = await updateFinding(projectId, data.id, {
          name: data.name,
          description: data.description,
          numericSeverity: data.numericSeverity,
          categoricalSeverity: data.categoricalSeverity,
          category: data.category,
          reference: data.reference,
          linkedAssetIds: data.linkedAssetIds,
          linkedArtifactIds: data.linkedArtifactIds,
        });
        setFindings((prev) => prev.map((f) => (f.id === data.id ? updated : f)));
      } else {
        const created = await createFinding(projectId, {
          name: data.name,
          description: data.description,
          numericSeverity: data.numericSeverity,
          categoricalSeverity: data.categoricalSeverity,
          category: data.category,
          reference: data.reference,
          linkedAssetIds: data.linkedAssetIds,
          linkedArtifactIds: data.linkedArtifactIds,
        });
        setFindings((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar achado");
    } finally {
      setModalLoading(false);
    }
  }

  function openCreate(): void {
    setModalMode("create");
    setModalFinding(null);
    setModalOpen(true);
  }

  function openEdit(finding: FindingResponse): void {
    setModalMode("edit");
    setModalFinding(finding);
    setModalOpen(true);
  }

  const categoryColumns = useMemo(
    () =>
      [...new Set(findings.flatMap((f) => (f.category ? [f.category] : [])))].sort().map((cat) => ({ id: cat, label: cat })),
    [findings],
  );

  useEffect(() => {
    setCategoryConfig(Object.fromEntries(categoryColumns.map((c) => [c.id, false])));
  }, [categoryColumns]);

  const filteredFindings = useMemo(() => {
    const active = Object.entries(categoryConfig).filter(([, v]) => v).map(([k]) => k);
    if (active.length === 0) return findings;
    return findings.filter((f) => f.category && active.includes(f.category));
  }, [findings, categoryConfig]);

  const columns: ColumnDefinition<FindingResponse>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Título",
        isRequired: true,
        getSortValue: (f) => f.name,
        renderCell: (f) => <span className="font-medium">{f.name}</span>,
      },
      {
        id: "description",
        label: "Descrição",
        getSortValue: (f) => f.description ?? "",
        renderCell: (f) => (
          <span className="text-muted-foreground max-w-[260px] truncate block">
            {f.description ?? "—"}
          </span>
        ),
      },
      {
        id: "categoricalSeverity",
        label: "Classificação",
        getSortValue: (f) => f.categoricalSeverity ?? "",
        renderCell: (f) =>
          f.categoricalSeverity ? (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${SEVERITY_BADGE[f.categoricalSeverity]}`}
            >
              {SEVERITY_LABELS[f.categoricalSeverity]}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "linkedArtifactIds",
        label: "Artefatos ligados",
        headClassName: "text-center",
        cellClassName: "text-center",
        getSortValue: (f) => f.linkedArtifactIds.length,
        renderCell: (f) => String(f.linkedArtifactIds.length),
      },
    ],
    [],
  );

  function renderExpandable(finding: FindingResponse): ReactElement {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          {finding.description && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Descrição: </span>
              <span className="text-foreground">{finding.description}</span>
            </div>
          )}
          {finding.category && (
            <div>
              <span className="text-muted-foreground">Categoria: </span>
              <span className="text-foreground">{finding.category}</span>
            </div>
          )}
          {finding.reference && (
            <div>
              <span className="text-muted-foreground">Referência: </span>
              <span className="text-foreground">{finding.reference}</span>
            </div>
          )}
          {finding.numericSeverity != null && (
            <div>
              <span className="text-muted-foreground">Severidade numérica: </span>
              <span className="text-foreground">{finding.numericSeverity}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Ativos ligados: </span>
            <span className="text-foreground">{finding.linkedAssetIds.length}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer"
            onClick={() => openEdit(finding)}
          >
            Editar
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors bg-transparent cursor-pointer"
            onClick={() => void handleDelete(finding.id)}
          >
            Excluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GenericTable
        tableId="finding-list"
        data={filteredFindings}
        columns={columns}
        clientPagination
        clientSearch
        pageSize={PAGE_SIZE}
        isLoading={loading}
        error={error}
        title="Achados"
        subtitle="Achados registrados e vinculados ao escopo da avaliação"
        filters={[
          {
            id: "createdBy",
            label: "Quem criou",
            type: "select",
            getValue: (f) => f.createdBy ?? null,
          },
          {
            id: "createdAt",
            label: "Data de criação",
            type: "dateRange",
            getValue: (f) => f.createdAt,
          },
        ]}
        primaryAction={{ label: "Adicionar", icon: Plus, onClick: openCreate }}
        headerExtra={
          <CategoryFilter
            columns={categoryColumns}
            visibleColumns={categoryConfig}
            onToggleColumn={(id) => setCategoryConfig((prev) => ({ ...prev, [id]: !prev[id] }))}
            onReset={() => setCategoryConfig(Object.fromEntries(categoryColumns.map((c) => [c.id, false])))}
          />
        }
        emptyMessage="Nenhum achado encontrado."
        expandableContent={renderExpandable}
      />

      <FindingModal
        open={modalOpen}
        loading={modalLoading}
        mode={modalMode}
        finding={modalFinding}
        projectId={projectId}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => void handleModalSubmit(data)}
      />
    </>
  );
}
