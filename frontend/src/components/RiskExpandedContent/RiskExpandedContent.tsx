import type { ReactElement } from "react";
import type { RiskResponse } from "@/api/risk";
import type { RiskModalOption } from "../RiskModal/RiskModal";
import { formatProbability } from "./format";

interface RiskExpandedContentProps {
  risk: RiskResponse;
  levelConfig: { label: string; className: string };
  probabilityMax: number;
  findings: RiskModalOption[];
  onEdit: (risk: RiskResponse) => void;
  onDelete: (risk: RiskResponse) => void;
}

export default function RiskExpandedContent({
  risk,
  levelConfig,
  probabilityMax,
  findings,
  onEdit,
  onDelete,
}: RiskExpandedContentProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      {/* Header: Nome + badge */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Nome:</span>
        <span className="text-foreground font-bold text-base">
          {risk.name || "—"}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${levelConfig.className}`}
        >
          {levelConfig.label}
        </span>
      </div>

      {/* Probabilidades — stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
              Prob. Ocorrência
            </p>
            <p className="text-foreground text-2xl font-bold tracking-tight">
              {formatProbability(risk.occurrenceProbability, probabilityMax)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-yellow-500/15 flex items-center justify-center">
            <span className="text-yellow-500 text-sm font-bold">⚡</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
              Prob. Impacto
            </p>
            <p className="text-foreground text-2xl font-bold tracking-tight">
              {formatProbability(risk.impactProbability, probabilityMax)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
            <span className="text-red-500 text-sm font-bold">🎯</span>
          </div>
        </div>
      </div>

      {/* Descrição + Consequências em 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Impacto direto ao negócio
          </p>
          <p className="text-foreground text-sm leading-relaxed">
            {risk.description || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Consequências
          </p>
          <p className="text-foreground text-sm leading-relaxed">
            {risk.consequences || "—"}
          </p>
        </div>
      </div>

      {/* Danos — 3 mini-cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Operações
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageOperations || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Indivíduos
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageIndividuals || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Outras Orgs
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageOtherOrgs || "—"}
          </p>
        </div>
      </div>

      {/* Recomendação */}
      <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-2.5">
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
          Recomendação
        </p>
        <p className="text-foreground text-sm leading-relaxed">
          {risk.recommendation || "—"}
        </p>
      </div>

      {/* Bottom: Nível de Risco + Achados vinculados */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 flex items-center gap-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Nível de Risco
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${levelConfig.className}`}
          >
            {levelConfig.label}
            {risk.riskLevel != null && ` (${risk.riskLevel})`}
          </span>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 col-span-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Achados vinculados
          </p>
          {(risk.findIds?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum achado vinculado.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {risk.findIds.map((fid) => {
                const found = findings.find((f) => f.id === fid);
                return (
                  <li
                    key={fid}
                    className="text-foreground text-sm flex items-center gap-1.5"
                  >
                    <span className="text-muted-foreground">•</span>
                    {found?.label ?? fid}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          type="button"
          className="px-4 py-1.5 text-sm rounded-md border border-border text-foreground hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(risk);
          }}
        >
          Editar
        </button>
        <button
          type="button"
          className="px-4 py-1.5 text-sm rounded-md border border-border text-foreground hover:border-destructive hover:text-destructive transition-colors bg-transparent cursor-pointer font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(risk);
          }}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
