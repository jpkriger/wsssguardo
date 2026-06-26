import type { RiskPriority } from "@/api/risk";

export const priorityConfig: Record<
  RiskPriority,
  { label: string; className: string }
> = {
  P1: { label: "Muito baixo", className: "bg-cyan-500/15 text-cyan-700" },
  P2: { label: "Baixo", className: "bg-green-500/15 text-green-700" },
  P3: { label: "Médio", className: "bg-yellow-500/15 text-yellow-700" },
  P4: { label: "Alto", className: "bg-orange-500/15 text-orange-700" },
  P5: { label: "Crítico", className: "bg-red-500/15 text-red-700" },
};

export const priorityOptions = (
  Object.keys(priorityConfig) as RiskPriority[]
).map((key) => ({
  value: key,
  label: priorityConfig[key].label,
}));
