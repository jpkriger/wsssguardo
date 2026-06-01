import { useEffect, useState, type ReactElement } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

import { projectsById } from "@/api/project";

interface ReportHeaderProps {
  projectId?: string;
  date?: Date;
}

export default function ReportHeader({
  projectId,
  date = new Date(),
}: ReportHeaderProps): ReactElement {
  const [companyName, setCompanyName] = useState<string>(
    "Carregando empresa...",
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCompanyName(): Promise<void> {
      if (!projectId) {
        setCompanyName("Empresa não informada");
        return;
      }

      try {
        const [project] = await projectsById([projectId]);
        if (cancelled) return;
        setCompanyName(project?.customerId ?? "Empresa indisponível");
      } catch {
        if (!cancelled) setCompanyName("Empresa indisponível");
      }
    }

    void loadCompanyName();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <header className="my-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
      {/* Esquerda: ícone + bloco de título */}
      <div className="flex items-start gap-3">
        <Shield
          className="mt-1 shrink-0 text-slate-800"
          size={36}
          strokeWidth={1.5}
        />
        <div className="space-y-0.5">
          <h1 className="text-3xl font-bold text-slate-800 leading-tight">
            Relatório Executivo de Risco de Segurança
          </h1>
          <p className="text-sm text-slate-500">
            Avaliação de Segurança Empresarial 2026
          </p>
          {/* Empresa abaixo do subtítulo */}
          <div className="pt-5 space-y-0.5">
            <p className="text-sm text-slate-400">Empresa</p>
            <p className="text-base font-semibold text-slate-800">
              {companyName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 shrink-0">
        <Badge
          variant="outline"
          className="rounded-sm border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold tracking-widest text-red-600"
        >
          CONFIDENCIAL
        </Badge>
        <div className="text-right space-y-0.5">
          <p className="text-sm text-slate-400">Data do Relatório</p>
          <p className="text-base font-semibold text-slate-800">
            {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
    </header>
  );
}
