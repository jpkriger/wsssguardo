import type { RiskCategoryDTO } from "@/api/projectConfiguration";

export interface RiskLevelConfig {
  label: string;
  badgeClassName: string;
  borderColor: string;
  /** Severity tier relative to the project's configured categories: 0 = most severe. */
  tier: number;
  /** Badge classes for the app UI (theme-adaptive), interpolated so the lowest
   * category is always green and the highest is always red regardless of how
   * many categories the project has configured. */
  appBadgeClassName: string;
}

export const DEFAULT_RISK_CATEGORIES: RiskCategoryDTO[] = [
  { label: "Baixo", minRange: 0, maxRange: 24 },
  { label: "Médio", minRange: 25, maxRange: 49 },
  { label: "Alto", minRange: 50, maxRange: 74 },
  { label: "Crítico", minRange: 75, maxRange: 100 },
];

const APP_BADGE_CLASSNAMES_ASC = [
  "bg-green-500/15 text-green-700",
  "bg-yellow-500/15 text-yellow-700",
  "bg-orange-500/15 text-orange-700",
  "bg-red-500/15 text-red-700",
];

export const FALLBACK_RISK_LEVEL: RiskLevelConfig = {
  label: "Baixo",
  badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  borderColor: "border-emerald-200",
  tier: Number.POSITIVE_INFINITY,
  appBadgeClassName: APP_BADGE_CLASSNAMES_ASC[0],
};

/**
 * Constrói um classificador de nível de risco a partir das categorias configuradas
 * no projeto. Mirrors the backend bucketing (RiskServiceImpl.isInCategory): a
 * non-last category is bounded above by the NEXT category's minRange (exclusive),
 * not by its own maxRange. generalRisk é uma média de danos inteiros, então
 * costuma ser fracionário; usar maxRange aqui deixava buracos (ex: 7.5 entre uma
 * categoria 4–7 e uma 8–10) que caíam pro FALLBACK "Baixo" enquanto o resumo do
 * backend contava o mesmo risco como Médio/Alto. Só a última categoria usa maxRange.
 */
export function buildGetRiskLevelConfig(
  categories: RiskCategoryDTO[],
): (riskLevel: number | null | undefined) => RiskLevelConfig {
  const sorted = [...categories].sort((a, b) => a.minRange - b.minRange);
  const configs: RiskLevelConfig[] = sorted.map((_, i) => {
    const tier = sorted.length - 1 - i;
    // i is ascending (0 = lowest severity). Interpolate across the 4-step
    // green→red ramp so the lowest category is always green and the highest
    // is always red, no matter how many categories the project has — a
    // simple "last 3 get a color, everyone else is green" count-down breaks
    // as soon as a project has fewer than 4 categories (e.g. Baixo landing
    // on yellow because it's 3rd-from-the-top instead of the actual bottom).
    const colorIndex =
      sorted.length === 1
        ? APP_BADGE_CLASSNAMES_ASC.length - 1
        : Math.floor((i * (APP_BADGE_CLASSNAMES_ASC.length - 1)) / (sorted.length - 1));
    const appBadgeClassName = APP_BADGE_CLASSNAMES_ASC[colorIndex];

    if (i === sorted.length - 1)
      return {
        label: sorted[i].label,
        badgeClassName: "border-red-200 bg-red-50 text-red-600",
        borderColor: "border-red-200",
        tier,
        appBadgeClassName,
      };
    if (i === sorted.length - 2)
      return {
        label: sorted[i].label,
        badgeClassName: "border-orange-200 bg-orange-50 text-orange-600",
        borderColor: "border-orange-200",
        tier,
        appBadgeClassName,
      };
    if (i === sorted.length - 3)
      return {
        label: sorted[i].label,
        badgeClassName: "border-amber-200 bg-amber-50 text-amber-600",
        borderColor: "border-amber-200",
        tier,
        appBadgeClassName,
      };
    return {
      label: sorted[i].label,
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      borderColor: "border-emerald-200",
      tier,
      appBadgeClassName,
    };
  });

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

