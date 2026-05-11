import { listProjects, type ProjectResponse as ApiProjectResponse } from "./project";

export type ProjectStatus = ApiProjectResponse["status"];

export interface ProjectResponse {
  id: string;
  name: string;
  customerId: string;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
}

export interface CompanyResponse {
  id: string;
  name: string;
  createdAt: string;
  projects: ProjectResponse[];
}

const MOCK_COMPANIES: CompanyResponse[] = [
  {
    id: "22222222-2222-2222-2222-000000000001",
    name: "Cliente Alpha (Fintech)",
    createdAt: "2026-01-14",
    projects: [],
  },
  {
    id: "22222222-2222-2222-2222-000000000002",
    name: "Cliente Beta (Varejo)",
    createdAt: "2026-02-09",
    projects: [],
  },
  {
    id: "22222222-2222-2222-2222-000000000003",
    name: "Cliente Gamma (Saúde)",
    createdAt: "2026-03-04",
    projects: [],
  },
  {
    id: "22222222-2222-2222-2222-000000000004",
    name: "Cliente Delta (Logística)",
    createdAt: "2026-04-15",
    projects: [],
  },
];

// Mock de projetos para teste
const MOCK_PROJECTS: ProjectResponse[] = [
  {
    id: "33333333-3333-3333-3333-000000000001",
    name: "App Mobile - Delta Express",
    customerId: "22222222-2222-2222-2222-000000000004",
    startDate: "2026-04-20",
    endDate: "2026-08-15",
    status: "IN_PROGRESS",
  },
  {
    id: "33333333-3333-3333-3333-000000000002",
    name: "Sistema de Rastreamento - Delta Log",
    customerId: "22222222-2222-2222-2222-000000000004",
    startDate: "2026-05-01",
    endDate: null,
    status: "PLANNING",
  },
];

async function fetchProjects(): Promise<ProjectResponse[]> {
  const apiProjects = await listProjects();

  const mappedApiProjects = apiProjects.map((project) => ({
    id: project.id,
    name: project.name,
    customerId: project.customerId,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
  }));

  return [...mappedApiProjects, ...MOCK_PROJECTS];
}

function createEmptyCompanies(): CompanyResponse[] {
  return MOCK_COMPANIES.map((company) => ({
    ...company,
    projects: [],
  }));
}

export async function listCompanies(): Promise<CompanyResponse[]> {
  const companies = createEmptyCompanies();
  const projects = await fetchProjects();

  const companyById = new Map(companies.map((company) => [company.id, company]));

  projects.forEach((project) => {
    const company = companyById.get(project.customerId);
    if (!company) return;

    company.projects.push(project);
  });

  return companies;
}