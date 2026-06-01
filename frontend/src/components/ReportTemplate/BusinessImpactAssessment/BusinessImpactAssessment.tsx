import type { ReactElement } from "react";
import { DollarSign, Settings, Scale, Award } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ImpactMetric {
  icon: ReactElement;
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

const MOCK_METRICS: ImpactMetric[] = [
  {
    icon: <DollarSign size={18} strokeWidth={1.5} />,
    label: "Impacto Financeiro",
    score: 10,
    maxScore: 10,
    description: "Potenciais multas regulatórias e perda de receita",
  },
  {
    icon: <Scale size={18} strokeWidth={1.5} />,
    label: "Conformidade Legal",
    score: 8.2,
    maxScore: 10,
    description: "Violações de conformidade LGPD/GDPR, risco de ação legal",
  },
  {
    icon: <Settings size={18} strokeWidth={1.5} />,
    label: "Impacto Operacional",
    score: 6.8,
    maxScore: 10,
    description: "Interrupção de serviços e preocupações com continuidade operacional",
  },
  {
    icon: <Award size={18} strokeWidth={1.5} />,
    label: "Reputação & Marca",
    score: 8.5,
    maxScore: 10,
    description: "Impacto significativo na marca e confiança do cliente",
  },
];

function barColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.9) return "bg-orange-500";
  if (pct >= 0.7) return "bg-red-500";
  return "bg-orange-400";
}

function scoreLabel(score: number, maxScore: number): string {
  return score === maxScore ? `${score}` : `${score}/${maxScore}`;
}

function ImpactCard({ metric }: { metric: ImpactMetric }): ReactElement {
  const pct = Math.min((metric.score / metric.maxScore) * 100, 100);
  const color = barColor(metric.score, metric.maxScore);
  const isMax = metric.score === metric.maxScore;

  return (
    <div className="space-y-2 py-2">
      {/* Progress bar */}
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-slate-400">{metric.icon}</span>
          <span className="font-semibold text-base text-slate-800">{metric.label}</span>
        </div>
        <span className={`font-bold text-base tabular-nums ${isMax ? "text-slate-900" : "text-slate-800"}`}>
          {scoreLabel(metric.score, metric.maxScore)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed">{metric.description}</p>
    </div>
  );
}

export default function BusinessImpactAssessment(): ReactElement {
  const left = [MOCK_METRICS[0], MOCK_METRICS[2]];
  const right = [MOCK_METRICS[1], MOCK_METRICS[3]];

  return (
    <div className="my-8 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-800">
          Avaliação de Impacto no Negócio{" "}
          <span className="font-normal text-slate-500">(projeto total)</span>
        </h2>
        <Separator className="bg-slate-200" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6">
        <div className="grid grid-cols-2 gap-x-12 gap-y-0 divide-x divide-slate-100">
          {/* Left column */}
          <div className="space-y-2 pr-12">
            {left.map((metric, i) => (
              <div key={metric.label}>
                <ImpactCard metric={metric} />
                {i < left.length - 1 && <Separator className="bg-slate-100 my-2" />}
              </div>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-2 pl-12">
            {right.map((metric, i) => (
              <div key={metric.label}>
                <ImpactCard metric={metric} />
                {i < right.length - 1 && <Separator className="bg-slate-100 my-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}