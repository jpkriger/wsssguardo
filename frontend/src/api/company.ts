import type { ProjectResponse as ApiProjectResponse } from "./project";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8080";

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

export interface CreateCompanyRequest {
  name: string;
}

export interface UpdateCompanyRequest {
  name: string;
}

interface CustomerDTO {
  id: string;
  name: string;
  createdAt: string;
  projects: ProjectResponse[];
}

export async function listCompanies(): Promise<CompanyResponse[]> {
  const res = await fetch(`${API_BASE}/api/customers`);
  if (!res.ok) throw new Error("Failed to fetch companies");
  const data = (await res.json()) as CustomerDTO[];
  return data;
}

export async function createCompany(request: CreateCompanyRequest): Promise<CompanyResponse> {
  const res = await fetch(`${API_BASE}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to create company");
  const data = (await res.json()) as { id: string; name: string; createdAt: string };
  return { ...data, projects: [] };
}

export async function updateCompany(id: string, request: UpdateCompanyRequest): Promise<CompanyResponse> {
  const res = await fetch(`${API_BASE}/api/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to update company");
  const data = (await res.json()) as { id: string; name: string; createdAt: string };
  return { ...data, projects: [] };
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/customers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete company");
}