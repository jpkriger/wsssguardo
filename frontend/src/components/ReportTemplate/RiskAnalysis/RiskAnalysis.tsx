import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  MapPin,
  Database,
  Scale,
  Wrench,
  LayoutGrid,
  ArrowRight,
  FileText,
  Users,
  Building,
} from "lucide-react";
import { fetchRisksByProject, type RiskResponse } from "@/api/risk";
import { listFindings, type FindingResponse } from "@/api/finding";
import { fetchAssetsByProject, type AssetResponse } from "@/api/asset";
import { listArtifacts, type ArtifactResponse } from "@/api/artifact";
import {
  getProjectConfiguration,
  type RiskCategoryDTO,
} from "@/api/projectConfiguration";

interface RiskAnalysisProps {
  projectId?: string;
  selectedRiskIds?: Record<string, boolean>;
  /** Show the asset/artifact evidence blocks within each risk card. */
  showAssetsArtifacts?: boolean;
  /** Show the recommended mitigation steps within each risk card. */
  showRecommendations?: boolean;
}

type RiskLevelLabel = "Baixo" | "Médio" | "Alto" | "Crítico";

interface RiskLevelConfig {
  label: RiskLevelLabel;
  badgeClassName: string;
  borderColor: string;
}

interface RiskAnalysisItem {
  risk: RiskResponse;
  riskLevel: RiskLevelConfig;
  linkedFindingCount: number;
  linkedFindingNames: string[];
  linkedAssetNames: string[];
  linkedArtifactNames: string[];
  potentialConsequences: string;
}

const DEFAULT_RISK_CATEGORIES: RiskCategoryDTO[] = [
  { label: "Baixo", minRange: 0, maxRange: 24 },
  { label: "Médio", minRange: 25, maxRange: 49 },
  { label: "Alto", minRange: 50, maxRange: 74 },
  { label: "Crítico", minRange: 75, maxRange: 100 },
];

const FALLBACK_RISK_LEVEL: RiskLevelConfig = {
  label: "Baixo",
  badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  borderColor: "border-emerald-200",
};

function buildGetRiskLevelConfig(
  categories: RiskCategoryDTO[],
): (riskLevel: number | null | undefined) => RiskLevelConfig {
  const sorted = [...categories].sort((a, b) => a.minRange - b.minRange);
  const configs: RiskLevelConfig[] = sorted.map((_, i) => {
    if (i === sorted.length - 1)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-red-200 bg-red-50 text-red-600",
        borderColor: "border-red-200",
      };
    if (i === sorted.length - 2)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-orange-200 bg-orange-50 text-orange-600",
        borderColor: "border-orange-200",
      };
    if (i === sorted.length - 3)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-amber-200 bg-amber-50 text-amber-600",
        borderColor: "border-amber-200",
      };
    return {
      label: sorted[i].label as RiskLevelLabel,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      borderColor: "border-emerald-200",
    };
  });

  return (riskLevel) => {
    if (riskLevel == null) return FALLBACK_RISK_LEVEL;
    const index = sorted.findIndex(
      (c) => riskLevel >= c.minRange && riskLevel <= c.maxRange,
    );
    return index === -1 ? FALLBACK_RISK_LEVEL : configs[index];
  };
}

function getUniqueNames(ids: string[], nameMap: Map<string, string>): string[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const id of ids) {
    const value = nameMap.get(id) ?? id;
    if (seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }
  return values;
}

function getPotentialConsequences(risk: RiskResponse): string {
  if (risk.consequences?.trim()) return risk.consequences.trim();
  if (risk.description?.trim()) return risk.description.trim();
  return "Interrupção de operações críticas, perda de confidencialidade e impacto na disponibilidade.";
}

function getMockRegulatoryTags(risk: RiskResponse): string[] {
  if (risk.riskLevel >= 75)
    return ["LGPD", "ISO 27001", "Auditoria obrigatória"];
  if (risk.riskLevel >= 50) return ["LGPD", "Controles internos"];
  if (risk.riskLevel >= 25) return ["Boas práticas", "Monitoramento"];
  return ["Acompanhamento preventivo"];
}

function getMockMitigationSteps(risk: RiskResponse): string[] {
  if (risk.riskLevel >= 75) {
    return [
      "Isolar o ativo ou processo impactado imediatamente.",
      "Executar análise de causa raiz e plano emergencial.",
      "Validar controles de contenção com as áreas responsáveis.",
    ];
  }
  if (risk.riskLevel >= 50) {
    return [
      "Reforçar monitoramento do cenário de risco.",
      "Priorizar ações de correção nas próximas entregas.",
      "Validar a redução do impacto nas dependências críticas.",
    ];
  }
  return [
    "Acompanhar o risco no ciclo de revisão.",
    "Aplicar controles preventivos e testes periódicos.",
  ];
}

function getMockResponsibleArea(risk: RiskResponse): string {
  if (risk.riskLevel >= 75) return "Segurança da Informação";
  if (risk.riskLevel >= 50) return "Operações e Tecnologia";
  if (risk.riskLevel >= 25) return "Gestão do Projeto";
  return "Área de Negócio";
}

export default function RiskAnalysis({
  projectId,
  selectedRiskIds,
  showAssetsArtifacts = true,
  showRecommendations = true,
}: RiskAnalysisProps): ReactElement {
  const [risks, setRisks] = useState<RiskResponse[]>([]);
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategoryDTO[]>(
    DEFAULT_RISK_CATEGORIES,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (!projectId) {
        setRisks([]);
        setFindings([]);
        setAssets([]);
        setArtifacts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [riskRes, findRes, assetRes, artifactRes, configRes] =
          await Promise.allSettled([
            fetchRisksByProject(projectId, 0, 1000),
            listFindings(projectId),
            fetchAssetsByProject(projectId, 0, 1000),
            listArtifacts(projectId),
            getProjectConfiguration(projectId),
          ]);
        if (cancelled) return;
        setRisks(riskRes.status === "fulfilled" ? riskRes.value.content : []);
        setFindings(findRes.status === "fulfilled" ? findRes.value : []);
        setAssets(
          assetRes.status === "fulfilled" ? assetRes.value.content : [],
        );
        setArtifacts(
          artifactRes.status === "fulfilled" ? artifactRes.value : [],
        );
        if (
          configRes.status === "fulfilled" &&
          configRes.value.riskConfig.categories.length > 0
        ) {
          setRiskCategories(configRes.value.riskConfig.categories);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Análise indisponível.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const getRiskLevelConfig = useMemo(
    () => buildGetRiskLevelConfig(riskCategories),
    [riskCategories],
  );

  const items = useMemo<RiskAnalysisItem[]>(() => {
    const findingMap = new Map(findings.map((f) => [f.id, f]));
    const assetMap = new Map(assets.map((a) => [a.id, a.name]));
    const artifactMap = new Map(artifacts.map((a) => [a.id, a.name]));

    const filteredRisks =
      selectedRiskIds != null
        ? risks.filter((risk) => selectedRiskIds[risk.id])
        : risks;

    return filteredRisks.map((risk) => {
      const linkedFindings = risk.findIds
        .map((id) => findingMap.get(id))
        .filter((f): f is FindingResponse => f != null);
      const linkedAssetIds = linkedFindings.flatMap((f) => f.linkedAssetIds);
      const linkedArtifactIds = linkedFindings.flatMap(
        (f) => f.linkedArtifactIds,
      );

      return {
        risk,
        riskLevel: getRiskLevelConfig(risk.riskLevel),
        linkedFindingCount: linkedFindings.length,
        linkedFindingNames: linkedFindings.slice(0, 3).map((f) => f.name),
        linkedAssetNames: getUniqueNames(linkedAssetIds, assetMap).slice(0, 3),
        linkedArtifactNames: getUniqueNames(
          linkedArtifactIds,
          artifactMap,
        ).slice(0, 3),
        potentialConsequences: getPotentialConsequences(risk),
      };
    });
  }, [assets, artifacts, findings, getRiskLevelConfig, risks, selectedRiskIds]);

  if (!projectId)
    return (
      <StatusBox>
        Selecione um projeto para visualizar a análise de riscos.
      </StatusBox>
    );
  if (loading) return <StatusBox>Carregando análise de riscos...</StatusBox>;
  if (error) return <StatusBox variant="error">{error}</StatusBox>;
  if (items.length === 0)
    return <StatusBox>Nenhum risco encontrado para este projeto.</StatusBox>;

  return (
    <div className="my-8 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-700">
          Análise dos Riscos
        </h2>
        <Separator className="bg-slate-200" />
      </div>
      {items.map((item) => (
        <RiskCard
          key={item.risk.id}
          item={item}
          showAssetsArtifacts={showAssetsArtifacts}
          showRecommendations={showRecommendations}
        />
      ))}
    </div>
  );
}

function RiskCard({
  item,
  showAssetsArtifacts,
  showRecommendations,
}: {
  item: RiskAnalysisItem;
  showAssetsArtifacts: boolean;
  showRecommendations: boolean;
}): ReactElement {
  const consequences = item.potentialConsequences
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const regulatoryTags: string[] = getMockRegulatoryTags(item.risk);
  const mitigationSteps: string[] = getMockMitigationSteps(item.risk);
  const responsibleArea: string = getMockResponsibleArea(item.risk);

  return (
    <div
      className={`rounded-2xl border ${item.riskLevel.borderColor} bg-white overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <AlertTriangle
            className="shrink-0 text-slate-400 mt-0.5"
            size={20}
            strokeWidth={1.5}
          />
          <h3 className="text-lg font-semibold text-slate-900">
            {item.risk.name}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 rounded-lg px-3 py-1 text-sm font-semibold ${item.riskLevel.badgeClassName}`}
        >
          {item.riskLevel.label}
        </Badge>
      </div>

      <div className="px-6 pb-6 space-y-5">
        <div>
          <SectionLabel>Descrição</SectionLabel>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            {item.risk.description ||
              "Sem descrição disponível para este risco."}
          </p>
        </div>

        {showAssetsArtifacts && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin
                  size={13}
                  className="text-slate-400"
                  strokeWidth={1.5}
                />
                <SectionLabel>Localização</SectionLabel>
              </div>
              <p className="text-sm text-slate-600">
                {item.linkedAssetNames[0] ?? "—"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Database
                  size={13}
                  className="text-slate-400"
                  strokeWidth={1.5}
                />
                <SectionLabel>Ativo afetado</SectionLabel>
              </div>
              <p className="text-sm text-slate-600">
                {item.linkedAssetNames.join(", ") || "Nenhum ativo vinculado"}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <LayoutGrid size={13} className="text-blue-600" strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Relacionamentos do risco
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <RelPill label="Risco" isStart />
            <ArrowRight size={14} className="text-slate-400" />
            <RelPill label={`${item.linkedFindingCount} Achados`} />
            <ArrowRight size={14} className="text-slate-400" />
            <RelPill label={`${item.linkedAssetNames.length} Ativos`} />
            <span className="text-slate-300">•</span>
            <RelPill label={`${item.linkedArtifactNames.length} Documentos`} />
          </div>
        </div>

        <div
          className={`grid gap-6 ${
            showAssetsArtifacts ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div>
            <SectionLabel>Achados relacionados</SectionLabel>
            <ul className="mt-2 space-y-1.5">
              {item.linkedFindingNames.length > 0 ? (
                item.linkedFindingNames.map((name) => (
                  <li
                    key={name}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {name}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-400">
                  Sem achados vinculados
                </li>
              )}
            </ul>
          </div>

          {showAssetsArtifacts && (
            <div>
              <SectionLabel>
                Evidências de suporte (ativos + auditoria)
              </SectionLabel>
              {item.linkedArtifactNames.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-400 mb-1">Documentos</p>
                  <ul className="space-y-1">
                    {item.linkedArtifactNames.map((name) => (
                      <li
                        key={name}
                        className="flex items-center gap-1.5 text-sm text-slate-600"
                      >
                        <FileText
                          size={13}
                          className="text-slate-400 shrink-0"
                          strokeWidth={1.5}
                        />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.linkedAssetNames.length > 1 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Reuniões</p>
                  <ul className="space-y-1">
                    {item.linkedAssetNames.slice(1).map((name) => (
                      <li
                        key={name}
                        className="flex items-center gap-1.5 text-sm text-slate-600"
                      >
                        <Users
                          size={13}
                          className="text-slate-400 shrink-0"
                          strokeWidth={1.5}
                        />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.linkedArtifactNames.length === 0 &&
                item.linkedAssetNames.length <= 1 && (
                  <p className="mt-2 text-sm text-slate-400">
                    Sem evidências vinculadas
                  </p>
                )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <SectionLabel className="text-red-700">
            Consequências potenciais de negócio
          </SectionLabel>
          <ul className="mt-2 space-y-1.5">
            {consequences.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-red-800"
              >
                <span className="mt-1 text-red-400">›</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {regulatoryTags.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Scale size={14} className="text-amber-600" strokeWidth={1.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Implicações regulatórias
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {regulatoryTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {showRecommendations && mitigationSteps.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Wrench size={14} className="text-slate-500" strokeWidth={1.5} />
              <SectionLabel>Ações de mitigação recomendadas</SectionLabel>
            </div>
            <ol className="space-y-2">
              {mitigationSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-slate-600"
                >
                  <span className="shrink-0 font-medium text-slate-400">
                    {i + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {responsibleArea && (
          <>
            <Separator className="bg-slate-100" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Building
                size={13}
                className="text-slate-400"
                strokeWidth={1.5}
              />
              Área responsável:
              <span className="font-semibold text-slate-700">
                {responsibleArea}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  className = "text-slate-500",
}: {
  children: React.ReactNode;
  className?: string;
}): ReactElement {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  );
}

function RelPill({
  label,
  isStart,
}: {
  label: string;
  isStart?: boolean;
}): ReactElement {
  return (
    <span
      className={`rounded-lg border px-3 py-1 text-xs font-medium ${
        isStart
          ? "border-blue-200 bg-blue-100 text-blue-700"
          : "border-blue-200 bg-white text-blue-700"
      }`}
    >
      {label}
    </span>
  );
}

function StatusBox({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "error";
}): ReactElement {
  return (
    <div
      className={`rounded-lg border p-6 text-sm ${
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      {children}
    </div>
  );
}
