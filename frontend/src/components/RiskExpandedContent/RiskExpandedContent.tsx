import { useState, type ReactElement } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { RiskResponse } from "@/api/risk";
import { summarizeRisk } from "@/api/risk";
import type { RiskModalOption } from "../RiskModal/RiskModal";
import { formatProbability } from "./format";
import { Badge } from "@/components/ui/badge";
import { priorityConfig } from "@/lib/priority";

interface RiskExpandedContentProps {
  risk: RiskResponse;
  projectId: string;
  probabilityMax: number;
  findings: RiskModalOption[];
  onEdit: (risk: RiskResponse) => void;
  onDelete: (risk: RiskResponse) => void;
  onUpdateRisk: (fields: Partial<RiskResponse>) => void;
}

export default function RiskExpandedContent({
  risk,
  projectId,
  probabilityMax,
  findings,
  onEdit,
  onDelete,
  onUpdateRisk,
}: RiskExpandedContentProps): ReactElement {
  const pConfig = priorityConfig[risk.priority] ?? priorityConfig.P3;
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  async function handleSummarize(): Promise<void> {
    setSummarizing(true);
    setSummarizeError(null);
    try {
      const result = await summarizeRisk(projectId, risk.id);
      onUpdateRisk({ aiSummary: result.summary });
    } catch (err: unknown) {
      setSummarizeError(err instanceof Error ? err.message : "Erro ao gerar resumo");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: Nome + badge */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Nome:</span>
        <span className="text-foreground font-bold text-base">
          {risk.name || "—"}
        </span>
        <Badge
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${pConfig.className}`}
        >
          {pConfig.label}
        </Badge>
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

      {/* Danos — 4 mini-cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Operações
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageOperations ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Indivíduos
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageIndividuals ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Outras Orgs
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageOtherOrgs ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            Danos Ativos
          </p>
          <p className="text-foreground text-sm font-semibold">
            {risk.damageAssets ?? "—"}
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

      {/* Bottom: Achados vinculados */}
      <div className="grid grid-cols-1">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
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

      {/* Resumo IA */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Resumo Executivo IA
          </p>
          <button
            type="button"
            disabled={summarizing}
            onClick={() => { void handleSummarize(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {summarizing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            {summarizing ? "Gerando..." : risk.aiSummary ? "Regenerar" : "Gerar resumo"}
          </button>
        </div>
        {summarizing ? (
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-3 w-full rounded-full bg-primary/10 animate-pulse" />
            <div className="h-3 w-[85%] rounded-full bg-primary/10 animate-pulse" />
            <div className="h-3 w-[70%] rounded-full bg-primary/10 animate-pulse" />
          </div>
        ) : risk.aiSummary ? (
          <p className="text-foreground text-sm leading-relaxed">{risk.aiSummary}</p>
        ) : (
          <p className="text-muted-foreground text-sm italic">Nenhum resumo gerado ainda.</p>
        )}
        {summarizeError && (
          <p className="text-destructive text-xs mt-1">{summarizeError}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 mt-4">
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
