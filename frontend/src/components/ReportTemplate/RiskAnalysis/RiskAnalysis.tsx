//RiskAnalysis.tsx
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Wrench,
  Building,
  LayoutGrid,
  Database,
  BookOpen,
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
  /** Severity tier relative to the project's configured categories: 0 = most severe. */
  tier: number;
}

interface RiskAnalysisItem {
  risk: RiskResponse;
  riskLevel: RiskLevelConfig;
  linkedFindings: FindingResponse[];
  linkedAssets: AssetResponse[];
  linkedArtifacts: ArtifactResponse[];
}

/** Max related items rendered per risk card before the list is truncated. */
const MAX_RELATED_PER_CARD = 5;

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
  tier: Number.POSITIVE_INFINITY,
};

function buildGetRiskLevelConfig(
  categories: RiskCategoryDTO[],
): (riskLevel: number | null | undefined) => RiskLevelConfig {
  const sorted = [...categories].sort((a, b) => a.minRange - b.minRange);
  const configs: RiskLevelConfig[] = sorted.map((_, i) => {
    const tier = sorted.length - 1 - i;
    if (i === sorted.length - 1)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-red-200 bg-red-50 text-red-600",
        borderColor: "border-red-200",
        tier,
      };
    if (i === sorted.length - 2)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-orange-200 bg-orange-50 text-orange-600",
        borderColor: "border-orange-200",
        tier,
      };
    if (i === sorted.length - 3)
      return {
        label: sorted[i].label as RiskLevelLabel,
        badgeClassName: "border-amber-200 bg-amber-50 text-amber-600",
        borderColor: "border-amber-200",
        tier,
      };
    return {
      label: sorted[i].label as RiskLevelLabel,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      borderColor: "border-emerald-200",
      tier,
    };
  });

  // Mirrors the backend bucketing (RiskServiceImpl.isInCategory): a non-last
  // category is bounded above by the NEXT category's minRange (exclusive), not
  // by its own maxRange. generalRisk is an average of integer damages, so it is
  // usually fractional; using maxRange here left gaps (e.g. 7.5 between a 4–7 and
  // an 8–10 category) that fell through to FALLBACK "Baixo" while the summary
  // counted the same risk as Médio/Alto. Only the last category uses maxRange.
  return (riskLevel) => {
    if (riskLevel == null) return FALLBACK_RISK_LEVEL;
    const index = sorted.findIndex((c, i) => {
      if (riskLevel < c.minRange) return false;
      const isLast = i === sorted.length - 1;
      return isLast ? riskLevel <= c.maxRange : riskLevel < sorted[i + 1].minRange;
    });
    return index === -1 ? FALLBACK_RISK_LEVEL : configs[index];
  };
}

// Stable anchor ids for in-document navigation. Keyed off the entity id (the
// backend guarantees it unique) rather than the display name, which can collide
// or be empty and produce duplicate DOM ids that break anchor navigation.
function findingAnchorId(id: string): string {
  return `finding-${id}`;
}
function artifactAnchorId(id: string): string {
  return `artifact-${id}`;
}
function assetAnchorId(id: string): string {
  return `asset-${id}`;
}

function getMockMitigationSteps(riskLevel: RiskLevelConfig): string[] {
  if (riskLevel.tier === 0) {
    return [
      "Isolar o ativo ou processo impactado imediatamente.",
      "Executar análise de causa raiz e plano emergencial.",
      "Validar controles de contenção com as áreas responsáveis.",
    ];
  }
  if (riskLevel.tier === 1) {
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

function getMockResponsibleArea(riskLevel: RiskLevelConfig): string {
  if (riskLevel.tier === 0) return "Segurança da Informação";
  if (riskLevel.tier === 1) return "Operações e Tecnologia";
  if (riskLevel.tier === 2) return "Gestão do Projeto";
  return "Área de Negócio";
}

function formatDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
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
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const artifactMap = new Map(artifacts.map((a) => [a.id, a]));

    const filteredRisks =
      selectedRiskIds != null
        ? risks.filter((risk) => selectedRiskIds[risk.id])
        : risks;

    return filteredRisks.map((risk) => {
      const linkedFindings = risk.findIds
        .map((id) => findingMap.get(id))
        .filter((f): f is FindingResponse => f != null);

      // Collect unique asset/artifact IDs from all linked findings
      const linkedAssetIdSet = new Set<string>();
      const linkedArtifactIdSet = new Set<string>();
      linkedFindings.forEach((f) => {
        f.linkedAssetIds.forEach((id) => linkedAssetIdSet.add(id));
        f.linkedArtifactIds.forEach((id) => linkedArtifactIdSet.add(id));
      });

      // Keep the full linked sets here: the relationship counts and the
      // final "Documentação de Suporte" section must reflect every related
      // entity. Per-card lists are truncated only at render time.
      const linkedAssets = [...linkedAssetIdSet]
        .map((id) => assetMap.get(id))
        .filter((a): a is AssetResponse => a != null);

      const linkedArtifacts = [...linkedArtifactIdSet]
        .map((id) => artifactMap.get(id))
        .filter((a): a is ArtifactResponse => a != null);

      return {
        risk,
        riskLevel: getRiskLevelConfig(risk.generalRisk),
        linkedFindings,
        linkedAssets,
        linkedArtifacts,
      };
    });
  }, [assets, artifacts, findings, getRiskLevelConfig, risks, selectedRiskIds]);

  // Collect all unique findings, artifacts, assets referenced in the report
  const allLinkedFindings = useMemo<FindingResponse[]>(() => {
    const seen = new Set<string>();
    const result: FindingResponse[] = [];
    for (const item of items) {
      for (const f of item.linkedFindings) {
        if (!seen.has(f.id)) {
          seen.add(f.id);
          result.push(f);
        }
      }
    }
    return result;
  }, [items]);

  const allLinkedArtifacts = useMemo<ArtifactResponse[]>(() => {
    const seen = new Set<string>();
    const result: ArtifactResponse[] = [];
    for (const item of items) {
      for (const a of item.linkedArtifacts) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          result.push(a);
        }
      }
    }
    return result;
  }, [items]);

  const allLinkedAssets = useMemo<AssetResponse[]>(() => {
    const seen = new Set<string>();
    const result: AssetResponse[] = [];
    for (const item of items) {
      for (const a of item.linkedAssets) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          result.push(a);
        }
      }
    }
    return result;
  }, [items]);

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
        <h2 className="text-2xl font-semibold text-slate-600">
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

      <SupportingDocumentation
        findings={allLinkedFindings}
        artifacts={allLinkedArtifacts}
        assets={allLinkedAssets}
      />
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
  const mitigationSteps: string[] = getMockMitigationSteps(item.riskLevel);
  const responsibleArea: string = getMockResponsibleArea(item.riskLevel);

  // Counts (pills) reflect the full relationship set; the lists below are
  // truncated to keep each card readable.
  const shownFindings = item.linkedFindings.slice(0, MAX_RELATED_PER_CARD);
  const shownArtifacts = item.linkedArtifacts.slice(0, MAX_RELATED_PER_CARD);
  const shownAssets = item.linkedAssets.slice(0, MAX_RELATED_PER_CARD);

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
        {/* Description */}
        <div>
          <SectionLabel>Descrição</SectionLabel>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            {item.risk.description ||
              "Sem descrição disponível para este risco."}
          </p>
        </div>

        {/* Risk relationships chain */}
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
            <RelPill label={`${item.linkedFindings.length} Achados`} />
            <ArrowRight size={14} className="text-slate-400" />
            <RelPill label={`${item.linkedArtifacts.length} Documentos`} />
            <ArrowRight size={14} className="text-slate-400" />
            <RelPill label={`${item.linkedAssets.length} Ativos`} />
          </div>
        </div>

        {/* Findings + Artifacts as anchor links (2 columns, mirroring Figma) */}
        <div className={`grid gap-6 ${showAssetsArtifacts ? "grid-cols-2" : "grid-cols-1"}`}>
          {/* Achados */}
          <div>
            <SectionLabel>Achados relacionados</SectionLabel>
            <ul className="mt-2 space-y-1.5">
              {shownFindings.length > 0 ? (
                shownFindings.map((finding) => (
                  <li key={finding.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <a
                      href={`#${findingAnchorId(finding.id)}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {finding.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-400">Sem achados vinculados</li>
              )}
            </ul>
          </div>

          {/* Artefatos */}
          {showAssetsArtifacts && (
            <div>
              <SectionLabel>Artefatos</SectionLabel>
              {shownArtifacts.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {shownArtifacts.map((artifact) => (
                    <li key={artifact.id} className="flex items-center gap-1.5 text-sm">
                      <FileText
                        size={13}
                        className="text-slate-400 shrink-0"
                        strokeWidth={1.5}
                      />
                      <a
                        href={`#${artifactAnchorId(artifact.id)}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {artifact.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Sem artefatos vinculados</p>
              )}
            </div>
          )}
        </div>

        {/* Ativos afetados (full-width block below the columns, mirroring Figma) */}
        {showAssetsArtifacts && (
          <div>
            <SectionLabel>Ativos afetados</SectionLabel>
            {shownAssets.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {shownAssets.map((asset) => (
                  <li key={asset.id} className="flex items-center gap-1.5 text-sm">
                    <Database
                      size={13}
                      className="text-slate-400 shrink-0"
                      strokeWidth={1.5}
                    />
                    <a
                      href={`#${assetAnchorId(asset.id)}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {asset.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Sem ativos vinculados</p>
            )}
          </div>
        )}

        {/* Mitigation steps */}
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

// ─── Supporting Documentation ──────────────────────────────────────────────

function SupportingDocumentation({
  findings,
  artifacts,
  assets,
}: {
  findings: FindingResponse[];
  artifacts: ArtifactResponse[];
  assets: AssetResponse[];
}): ReactElement | null {
  const hasContent =
    findings.length > 0 || artifacts.length > 0 || assets.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-12 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-slate-500" strokeWidth={1.5} />
          <h2 className="text-2xl font-semibold text-slate-600">
            Documentação de Suporte
          </h2>
        </div>
        <Separator className="bg-slate-200" />
      </div>

      {findings.length > 0 && (
        <DocSection title="Achados (Findings)">
          {findings.map((finding) => (
            <DocEntry
              key={finding.id}
              anchorId={findingAnchorId(finding.id)}
              title={finding.name}
              description={finding.description ?? undefined}
              date={finding.createdAt}
              reference={finding.reference ?? undefined}
              meta={
                finding.categoricalSeverity
                  ? `Severidade: ${finding.categoricalSeverity}`
                  : undefined
              }
            />
          ))}
        </DocSection>
      )}

      {artifacts.length > 0 && (
        <DocSection title="Artefatos">
          {artifacts.map((artifact) => (
            <DocEntry
              key={artifact.id}
              anchorId={artifactAnchorId(artifact.id)}
              title={artifact.name}
              description={artifact.description ?? undefined}
              date={artifact.createdAt}
              reference={artifact.driveLink || artifact.content || undefined}
              meta={artifact.contentType ? `Tipo: ${artifact.contentType}` : undefined}
            />
          ))}
        </DocSection>
      )}

      {assets.length > 0 && (
        <DocSection title="Ativos">
          {assets.map((asset) => (
            <DocEntry
              key={asset.id}
              anchorId={assetAnchorId(asset.id)}
              title={asset.name}
              description={asset.description ?? undefined}
              date={asset.createdAt}
              meta={asset.content ? `Referência: ${asset.content}` : undefined}
            />
          ))}
        </DocSection>
      )}
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <div className="space-y-0">
      <h3 className="text-base font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function DocEntry({
  anchorId,
  title,
  description,
  date,
  meta,
  reference,
}: {
  anchorId: string;
  title: string;
  description?: string;
  date?: string;
  meta?: string;
  /** Document/source reference (e.g. drive link or file path) shown like the Figma. */
  reference?: string;
}): ReactElement {
  const formattedDate = formatDate(date);

  return (
    <div
      id={anchorId}
      className="py-4 pl-4 border-l-2 border-red-400 scroll-mt-8"
    >
      <p className="text-sm font-semibold text-blue-700">{title}</p>
      {description && (
        <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      )}
      {reference && (
        <p className="mt-1 text-xs font-mono text-slate-400 break-all">
          {reference}
        </p>
      )}
      <div className="mt-1 flex items-center gap-3 flex-wrap">
        {formattedDate && (
          <span className="text-xs text-slate-400">{formattedDate}</span>
        )}
        {meta && (
          <span className="text-xs text-slate-400">{meta}</span>
        )}
      </div>
    </div>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────

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