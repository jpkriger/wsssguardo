import { useEffect, useMemo, useState, type ReactElement } from "react";

import { getProjectSummary } from "@/api/project";
import {
  getProjectConfiguration,
  type RiskCategoryDTO,
} from "@/api/projectConfiguration";
import { fetchRisksByProject, type RiskResponse } from "@/api/risk";
import { listFindings, type FindingResponse } from "@/api/finding";
import { Separator } from "@/components/ui/separator";

interface RiskOverviewProps {
  projectId?: string;
}

type PriorityLabel = "Alta" | "Média" | "Baixa";

interface RiskRow {
  id: string;
  name: string;
  riskLevelLabel: RiskLevelConfig;
  businessImpact: string;
  linkedFindings: string;
  priority: PriorityLabel;
}

const PRIORITY_BY_INDEX: PriorityLabel[] = ["Alta", "Média", "Baixa"];

type RiskLevelLabel = "Alta" | "Média" | "Baixa";

interface RiskLevelConfig {
  label: RiskLevelLabel;
  className: string;
}

const RISK_LEVEL_FALLBACK: RiskLevelConfig = {
  label: "Baixa",
  className: "bg-green-600 text-white",
};

function categoryClassName(index: number, total: number): string {
  if (index === total - 1) return "border-red-200 bg-red-50 text-red-700";
  if (index === total - 2) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

export default function RiskOverview({
  projectId,
}: RiskOverviewProps): ReactElement {
  const [risks, setRisks] = useState<RiskResponse[]>([]);
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategoryDTO[]>([
    { label: "Baixo", minRange: 0, maxRange: 32 },
    { label: "Médio", minRange: 33, maxRange: 65 },
    { label: "Alto", minRange: 66, maxRange: 100 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRiskOverview(): Promise<void> {
      if (!projectId) {
        setRisks([]);
        setFindings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [, riskPage, projectFindings] = await Promise.all([
          getProjectSummary(projectId),
          fetchRisksByProject(projectId, 0, 1000),
          listFindings(projectId),
        ]);

        const config = await getProjectConfiguration(projectId);

        if (cancelled) return;

        setRisks(riskPage.content);
        setFindings(projectFindings);
        if (config.riskConfig.categories.length > 0) {
          setRiskCategories(config.riskConfig.categories);
        }
      } catch (loadError) {
        if (cancelled) return;

        setRisks([]);
        setFindings([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Tabela indisponível.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRiskOverview();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const getRiskLevelConfig = useMemo(
    () => buildGetRiskLevelConfig(riskCategories),
    [riskCategories],
  );

  const rows = useMemo<RiskRow[]>(() => {
    const findingMap = new Map(
      findings.map((finding) => [finding.id, finding.name]),
    );

    return risks.map((risk, index) => ({
      id: risk.id,
      name: risk.name,
      riskLevelLabel: getRiskLevelConfig(risk.generalRisk),
      businessImpact:
        risk.consequences?.trim() ||
        risk.description?.trim() ||
        "Sem descrição.",
      linkedFindings:
        risk.findIds.length > 0
          ? risk.findIds
              .map((findingId) => findingMap.get(findingId) ?? findingId)
              .join(", ")
          : "Nenhum achado vinculado",
      priority: PRIORITY_BY_INDEX[index % PRIORITY_BY_INDEX.length],
    }));
  }, [findings, getRiskLevelConfig, risks]);

  return (
    <>
      <div className="space-y-2 text-slate-300">
        <div className="text-2xl font-semibold text-slate-600">
          Visão Geral dos Riscos
        </div>
        <Separator className="bg-current" />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm [color-scheme:light]">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Nível de risco</th>
              <th className="px-4 py-3">Impacto ao negócio</th>
              <th className="px-4 py-3">Achado vinculado</th>
              <th className="px-4 py-3">Prioridade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Carregando tabela...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-4 text-red-600" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Nenhum risco encontrado para este projeto.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`align-top ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}`}
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${row.riskLevelLabel.className}`}
                    >
                      {row.riskLevelLabel.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row.businessImpact}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row.linkedFindings}
                  </td>
                  <td className="px-4 py-4">
                    <PriorityPill priority={row.priority} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PriorityPill({ priority }: { priority: PriorityLabel }): ReactElement {
  const colorClasses =
    priority === "Alta"
      ? "border-red-200 bg-red-50 text-red-700"
      : priority === "Média"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${colorClasses}`}
    >
      {priority}
    </span>
  );
}
