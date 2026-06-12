import type { ReactElement } from "react";
import { DollarSign, Scale, Activity, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Severity = "Crítico" | "Alto" | "Médio" | "Baixo";

interface ImpactCategory {
  icon: ReactElement;
  label: string;
  severity: Severity;
  distribution: { low: number; medium: number; high: number; critical: number };
  description: string;
  businessImpact: string[];
  actions: string[];
}

const MOCK_DATA: ImpactCategory[] = [
  {
    icon: <DollarSign size={18} strokeWidth={1.5} />,
    label: "Financial Impact",
    severity: "Crítico",
    distribution: { low: 1, medium: 2, high: 4, critical: 3 },
    description:
      "Alto risco de multas regulatórias (LGPD/GDPR) e potencial perda de receita devido a interrupções de serviço.",
    businessImpact: [
      "Potencial perda financeira de R$ 2M–5M",
      "Risco de sanções regulatórias e multas",
      "Perda de receita por interrupção de serviços",
    ],
    actions: [
      "Implementar controles de proteção de dados",
      "Realizar assessment de conformidade LGPD/GDPR",
      "Estabelecer budget de emergência para incidentes",
    ],
  },
  {
    icon: <Scale size={18} strokeWidth={1.5} />,
    label: "Legal & Compliance",
    severity: "Alto",
    distribution: { low: 0, medium: 3, high: 5, critical: 2 },
    description:
      "Não conformidade com LGPD, GDPR e SOC 2 identificada em múltiplos controles.",
    businessImpact: [
      "Risco de ações judiciais e processos regulatórios",
      "Possível suspensão de operações internacionais",
      "Impacto em certificações e auditorias",
    ],
    actions: [
      "Atualizar política de privacidade e DPO",
      "Remediar gaps de conformidade SOC 2",
      "Implementar programa de awareness legal",
    ],
  },
  {
    icon: <Activity size={18} strokeWidth={1.5} />,
    label: "Operational Impact",
    severity: "Alto",
    distribution: { low: 2, medium: 4, high: 3, critical: 1 },
    description:
      "Continuidade operacional em risco devido a gaps em disaster recovery e incident response.",
    businessImpact: [
      "Possível interrupção de serviços críticos",
      "MTTR acima de SLAs acordados",
      "Impacto em disponibilidade e performance",
    ],
    actions: [
      "Revisar e testar plano de DR/BC",
      "Implementar playbooks de incident response",
      "Estabelecer métricas de RTO/RPO",
    ],
  },
  {
    icon: <TrendingUp size={18} strokeWidth={1.5} />,
    label: "Reputation & Brand",
    severity: "Alto",
    distribution: { low: 1, medium: 2, high: 5, critical: 2 },
    description:
      "Exposição significativa à mídia negativa em caso de breach de segurança.",
    businessImpact: [
      "Perda de confiança de clientes e investidores",
      "Impacto em NPS e taxa de churn",
      "Redução em aquisição de novos clientes",
    ],
    actions: [
      "Desenvolver plano de comunicação de crise",
      "Estabelecer protocolo de relações públicas",
      "Implementar monitoramento de mídia/redes sociais",
    ],
  },
  {
    icon: <Users size={18} strokeWidth={1.5} />,
    label: "Terceiros e Parceiros",
    severity: "Alto",
    distribution: { low: 1, medium: 3, high: 4, critical: 1 },
    description:
      "Cadeia de fornecedores com avaliação de segurança inadequada.",
    businessImpact: [
      "Risco de comprometimento via supply chain",
      "Exposição a vulnerabilidades de terceiros",
      "Falta de visibilidade em controles externos",
    ],
    actions: [
      "Implementar programa de TPRM (Third-Party Risk)",
      "Estabelecer SLAs de segurança com vendors",
      "Realizar security assessments de fornecedores críticos",
    ],
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  Crítico: "bg-red-50 text-red-700 border border-red-300",
  Alto: "bg-amber-50 text-amber-700 border border-amber-300",
  Médio: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  Baixo: "bg-green-50 text-green-700 border border-green-300",
};

function RiskBar(): ReactElement {
  return (
    <div className="h-2 w-full rounded-full overflow-hidden flex">
      <div className="bg-green-500" style={{ width: "20%" }} />
      <div className="bg-yellow-400" style={{ width: "20%" }} />
      <div className="bg-orange-400" style={{ width: "30%" }} />
      <div className="bg-red-500" style={{ width: "30%" }} />
    </div>
  );
}

function SectionLabel({
  children,
  className = "text-slate-700",
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

function ImpactCard({ item }: { item: ImpactCategory }): ReactElement {
  const { low, medium, high, critical } = item.distribution;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-slate-700">{item.icon}</span>
          <span className="font-bold text-sm text-slate-700">
            {item.label}
          </span>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-md ${SEVERITY_STYLES[item.severity]}`}
        >
          {item.severity}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <RiskBar />
        <p className="text-xs text-slate-400 mt-1.5">
          Distribuição: {low} Baixo &bull; {medium} Médio &bull; {high} Alto &bull; {critical}{" "}
          Crítico
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {item.description}
      </p>

      {/* Business Impact */}
      <div>
        <SectionLabel>Impacto para o negócio</SectionLabel>
        <ul className="mt-2 space-y-1.5">
          {item.businessImpact.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <SectionLabel>Ação recomendada</SectionLabel>
        </div>
        <ol className="space-y-1.5">
          {item.actions.map((action, i) => (
            <li
              key={action}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className="shrink-0 text-slate-400">
                <ArrowRight className="h-4 w-4"/>
              </span>
              {action}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function BusinessImpactAssessment(): ReactElement {
  const grid = MOCK_DATA.slice(0, 4);
  const full = MOCK_DATA[4];

  return (
    <div className="my-8 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-600">
          Business Impact Assessment
        </h2>
        <Separator className="bg-slate-200" />
      </div>

      <div className="space-y-3.5">
        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {grid.map((item) => (
            <ImpactCard key={item.label} item={item} />
          ))}
        </div>

        {/* Full-width card */}
        <ImpactCard item={full} />
      </div>
    </div>
  );
}