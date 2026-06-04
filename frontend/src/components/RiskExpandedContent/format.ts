/** Formats a probability value as a rounded percentage of `max`. */
export function formatProbability(
  value: number | null | undefined,
  max = 100,
): string {
  if (value == null) return "—";
  return `${Math.round((value / max) * 100)}%`;
}
