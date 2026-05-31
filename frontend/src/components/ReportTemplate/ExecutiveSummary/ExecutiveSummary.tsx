import { useEffect, useState, type ReactElement } from "react";
import { File, TriangleAlert, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getProjectSummary, type ProjectSummaryDTO } from "@/api/project";

interface ExecutiveSummaryProps {
  projectId?: string;
  mockCriticalRisks?: number;
  mockHighRisks?: number;
  mockWssScore?: number;
}

const DEFAULT_MOCK_CRITICAL_RISKS = 2;
const DEFAULT_MOCK_HIGH_RISKS = 5;
const DEFAULT_MOCK_WSS_SCORE = 8.7;

export default function ExecutiveSummary({
  projectId,
  mockCriticalRisks = DEFAULT_MOCK_CRITICAL_RISKS,
  mockHighRisks = DEFAULT_MOCK_HIGH_RISKS,
  mockWssScore = DEFAULT_MOCK_WSS_SCORE,
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                icon={<File className="size-4 text-slate-600" />}
                label="RISCOS TOTAIS"
                value={summary.riskCount}
              />
              <StatTile
                icon={<TriangleAlert className="size-4 text-red-500" />}
                label="RISCOS CRÍTICOS"
                value={mockCriticalRisks}
              />
              <StatTile
                icon={<TriangleAlert className="size-4 text-amber-500" />}
                label="RISCOS ALTOS"
                value={mockHighRisks}
              />
              <StatTile
                icon={<Shield className="size-4" />}
                label="WSS SCORE"
                value={mockWssScore}
                valueFormat="decimal"
              />
            </div>

            <Card className="border border-slate-200 bg-white shadow-none">
              <CardContent className="p-4 text-left">
                <div className="flex flex-col gap-2 items-start">
                  <div className="text-sm font-medium text-slate-900">
                    RESUMO
                  </div>
                  <p className="text-sm text-slate-600">
                    Este projeto possui {summary.riskCount} riscos no total, com{" "}
                    {mockCriticalRisks} crítico(s), {mockHighRisks} alto(s) e um
                    WSS Score de {formatScore(mockWssScore)} em uma escala de 0
                    a 10.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
  valueFormat = "integer",
}: {
  icon: ReactElement;
  label: string;
  value: number;
  valueFormat?: "integer" | "decimal";
}): ReactElement {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mt-0.5 p-2">{icon}</div>
      <div>
        <div className="text-sm text-slate-600">{label}</div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">
          {valueFormat === "decimal" ? (
            <>
              <span>{formatScore(value)}</span>
              <span className="ml-0.5 text-lg font-medium text-slate-500">/10</span>
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
