import { ReactElement, useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompaniesTable, type Company } from "../components/CompaniesTable/CompaniesTable";
import type { CompanyProject } from "../components/CompanyProjectsTable/CompanyProjectsTable";
import { listCompanies, type CompanyResponse, type ProjectResponse } from "../api/company";

// Helpers 

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function deriveStatus(
  startDate: string | null,
  endDate: string | null,
): CompanyProject["status"] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (end && today > end) return "Atrasado";
  if (start && today < start) return "Planejado";
  return "Em andamento";
}

function mapProject(project: ProjectResponse): CompanyProject {
  return {
    id: project.id,
    name: project.name,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    status: deriveStatus(project.startDate, project.endDate),
  };
}


// Page 

export default function Companies(): ReactElement {
  const [apiCompanies, setApiCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCompanies(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const data = await listCompanies();
        if (!cancelled) setApiCompanies(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar empresas",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCompanies();
    return () => { cancelled = true; };
  }, []);

  const companies = useMemo(() => apiCompanies.map(mapCompany), [apiCompanies]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <section className="mx-auto px-6 lg:px-24 max-w-[1280px] w-full">
        <div className="flex flex-col gap-2">
          <h1 className="!text-[32px] !font-bold text-foreground">
            Gestão de Empresas
          </h1>
          <p className="!text-[14px] text-muted-foreground">
            Gerencie empresas e seus projetos de análise de segurança associados.
          </p>
        </div>

        {loading && (
          <p className="mt-4 !text-[14px] text-muted-foreground">
            Carregando empresas...
          </p>
        )}
        {error && (
          <p className="mt-4 !text-[14px] text-destructive">{error}</p>
        )}
      </section>

      {!loading && !error && (
        <div className="mx-auto px-6 lg:px-24 max-w-[1280px] w-full flex flex-col gap-4">

          {/* Busca e botão fora da tabela */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa ou projeto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-[13px] w-72 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
              />
            </div>
            <Button
              className="h-9 text-[13px] gap-1.5 font-medium px-4"
              style={{ background: "#d4a574", color: "#0f1117" }}
              onClick={() => console.log("criar empresa")}
            >
              <Plus className="h-4 w-4" />
              Criar Empresa
            </Button>
          </div>

          {/* Tabela */}
          <CompaniesTable
            companies={companies}
            totalCount={companies.length}
            search={search}
            onSearchChange={setSearch}
            onEditCompany={(id) => console.log("editar empresa", id)}
            onDeleteCompany={(id) => console.log("deletar empresa", id)}
            onCreateProject={(companyId) => console.log("criar projeto", companyId)}
            onEditProject={(id) => console.log("editar projeto", id)}
            onDeleteProject={(id) => console.log("deletar projeto", id)}
          />
        </div>
      )}
    </div>
  );
}

function mapCompany(company: CompanyResponse): Company {
  return {
    id: company.id,
    name: company.name,
    createdAt: formatDate(company.createdAt),
    totalProjects: company.projects.length,
    projects: Array.isArray((company as { projects?: ProjectResponse[] }).projects)
      ? (company as { projects: ProjectResponse[] }).projects.map(mapProject)
      : [],
  } as Company;
}
