import { type FindingSeverity } from "../api/finding";

export function deriveSeverity(n: number): FindingSeverity | undefined {
  if (n <= 0) return undefined;
  if (n <= 3) return "INFO";
  if (n <= 5) return "LOW";
  if (n <= 7) return "MEDIUM";
  if (n <= 9) return "HIGH";
  return "CRITICAL";
}
