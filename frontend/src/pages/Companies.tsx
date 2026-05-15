import { ReactElement, useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompaniesTable, type Company } from "../components/CompaniesTable/CompaniesTable";
import type { CompanyProject } from "../components/CompanyProjectsTable/CompanyProjectsTable";
import CompanyModal from "../components/CompanyModal/CompanyModal";
import ProjectModal, { type ProjectFormData } from "../components/ProjectModal/ProjectModal";
import ConfirmDialog from "../components/ConfirmDialog/ConfirmDialog";
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  type CompanyResponse,
  type ProjectResponse as CompanyProjectResponse,
} from "../api/company";
import {
  createProject,
  updateProject,
  deleteProject,
  type ProjectResponse,
  type ProjectStatus,
} from "../api/project";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function deriveStatus(
  apiStatus: CompanyProjectResponse["status"],
  endDate: string | null,
): CompanyProject["status"] {
  if (apiStatus === "COMPLETED") return "Concluído";
  if (apiStatus === "CANCELLED") return "Cancelado";
  if (apiStatus === "ON_HOLD") return "Em espera";
  if (endDate && new Date(endDate) < new Date()) return "Atrasado";
  return "Em andamento";
}

function mapProject(project: CompanyProjectResponse): CompanyProject {
  return {
    id: project.id,
    name: project.name,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    status: deriveStatus(project.status, project.endDate),
    rawStatus: project.status,
  };
}

function mapCompany(company: CompanyResponse): Company {
  return {
    id: company.id,
    name: company.name,
    createdAt: formatDate(company.createdAt),
    totalProjects: company.projects.length,
    projects: company.projects.map(mapProject),
  };
}

export default function Companies(): ReactElement {
  const [apiCompanies, setApiCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Company modal state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyResponse | undefined>();

  // Project modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectResponse | undefined>();
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");
  const [targetCompanyName, setTargetCompanyName] = useState<string>("");

  // Delete state (shared between company and project)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "company" | "project";
  } | undefined>();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCompanies = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCompanies();
      setApiCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const companies = useMemo(() => apiCompanies.map(mapCompany), [apiCompanies]);

  // --- Company handlers ---

  const handleCreateCompany = (): void => {
    setEditingCompany(undefined);
    setCompanyModalOpen(true);
  };

  const handleEditCompany = (id: string): void => {
    const company = apiCompanies.find((c) => c.id === id);
    if (company) {
      setEditingCompany(company);
      setCompanyModalOpen(true);
    }
  };

  const handleSaveCompany = async (name: string): Promise<void> => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, { name });
    } else {
      await createCompany({ name });
    }
    await loadCompanies();
  };

  const handleDeleteCompany = (id: string, name: string): void => {
    setDeleteTarget({ id, name, type: "company" });
  };

  // --- Project handlers ---

  const handleCreateProject = (companyId: string, companyName: string): void => {
    setEditingProject(undefined);
    setTargetCompanyId(companyId);
    setTargetCompanyName(companyName);
    setProjectModalOpen(true);
  };

  const handleEditProject = (projectId: string): void => {
    const project = apiCompanies
      .flatMap((c) => c.projects)
      .find((p) => p.id === projectId);
    if (project) {
      setEditingProject(project as unknown as ProjectResponse);
      setProjectModalOpen(true);
    }
  };

  const handleSaveProject = async (data: ProjectFormData): Promise<void> => {
    if (editingProject) {
      await updateProject(editingProject.id, {
        name: data.name,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });
    } else {
      await createProject({
        name: data.name,
        customerId: targetCompanyId,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });
    }
    await loadCompanies();
  };

  const handleDeleteProject = (projectId: string, projectName: string): void => {
    setDeleteTarget({ id: projectId, name: projectName, type: "project" });
  };

  const handleUpdateProjectStatus = async (projectId: string, status: ProjectStatus): Promise<void> => {
    try {
      await updateProject(projectId, { status });
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status do projeto");
    }
  };

  // --- Shared delete confirm ---

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      if (deleteTarget.type === "company") {
        await deleteCompany(deleteTarget.id);
      } else {
        await deleteProject(deleteTarget.id);
      }
      setDeleteTarget(undefined);
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
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
          <p className="mt-4 !text-[14px] text-muted-foreground">Carregando empresas...</p>
        )}
        {error && (
          <p className="mt-4 !text-[14px] text-destructive">{error}</p>
        )}
      </section>

      {!loading && !error && (
        <div className="mx-auto px-6 lg:px-24 max-w-[1280px] w-full flex flex-col gap-4">
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
              onClick={handleCreateCompany}
            >
              <Plus className="h-4 w-4" />
              Criar Empresa
            </Button>
          </div>

          <CompaniesTable
            companies={companies}
            search={search}
            onSearchChange={setSearch}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompany}
            onCreateProject={handleCreateProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onCompleteProject={(id) => void handleUpdateProjectStatus(id, "COMPLETED")}
            onCancelProject={(id) => void handleUpdateProjectStatus(id, "CANCELLED")}
          />
        </div>
      )}

      <CompanyModal
        isOpen={companyModalOpen}
        company={editingCompany}
        onClose={() => setCompanyModalOpen(false)}
        onSubmit={handleSaveCompany}
      />

      <ProjectModal
        isOpen={projectModalOpen}
        project={editingProject}
        companyName={targetCompanyName}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleSaveProject}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === "project" ? "Deletar Projeto" : "Deletar Empresa"}
        message={`Tem certeza que deseja deletar "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(undefined)}
        loading={deleteLoading}
        confirmText="Deletar"
      />
    </div>
  );
}
