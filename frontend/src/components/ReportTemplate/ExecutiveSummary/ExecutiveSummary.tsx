import { useEffect, useState, type ReactElement } from "react";
import { File, TriangleAlert, CircleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProjectSummary, type ProjectSummaryDTO } from "@/api/project";

interface ExecutiveSummaryProps {
  projectId?: string;
  customSummary?: string;
  highRisks?: number;
  mediumRisks?: number;
}

export default function ExecutiveSummary({
  projectId,
  customSummary,
  highRisks = 0,
  mediumRisks = 0,
}: ExecutiveSummaryProps): ReactElement {
  const [summary, setSummary] = useState<ProjectSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary(): Promise<void> {
      if (!projectId) {
        setSummary(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getProjectSummary(projectId);
        if (!cancelled) {
          setSummary(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSummary(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Resumo indisponível.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <>
      <div className="space-y-2 text-slate-300">
        <div className="text-2xl font-semibold text-slate-600">
          Resumo Executivo
        </div>
        <Separator className="bg-current" />
      </div>
      <Card className="border border-slate-200 bg-slate-50 text-slate-900 shadow-sm [color-scheme:light]">
        <CardContent className="p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Carregando resumo...</p>
          ) : error || !summary ? (
            <p className="text-sm text-red-600">
              {error ?? "Resumo indisponível."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <StatTile
                  icon={<File className="size-4 text-slate-600" />}
                  label="RISCOS TOTAIS"
                  value={summary.riskCount}
                  borderColor="slate-200"
                />
                <StatTile
                  icon={<CircleAlert className="size-4 text-red-500" />}
                  label="RISCOS CRÍTICOS"
                  value={highRisks}
                  borderColor="red-200"
                />
                <StatTile
                  icon={<TriangleAlert className="size-4 text-yellow-500" />}
                  label="RISCOS ALTOS"
                  value={mediumRisks}
                  borderColor="slate-200"
                />
              </div>

              {customSummary && (
                <Card className="border border-slate-200 bg-white shadow-none">
                  <CardContent className="p-4 text-left">
                    <div className="flex flex-col gap-2 items-start">
                      <div className="text-sm font-medium text-slate-900">
                        RESUMO GERADO POR LLM
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {customSummary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  valueFormat = "integer",
  borderColor,
}: {
  icon: ReactElement;
  label: string;
  value: number;
  valueFormat?: "integer" | "decimal";
  borderColor: string;
}): ReactElement {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-${borderColor} bg-white p-4`}>
      <div className="mt-0.5 p-2">{icon}</div>
      <div>
        <div className="text-sm text-slate-600">{label}</div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">
          {valueFormat === "decimal" ? (
            <>
              <span>{formatScore(value)}</span>
              <span className="ml-0.5 text-lg font-medium text-slate-500">
                /10
              </span>
            </>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}

function formatScore(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
