import { parseApiErrorResponse } from "./errors";
import type { ProjectResponse as ApiProjectResponse } from "./project";

const BASE = "/api/customers";

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

export async function listCompanies(): Promise<CompanyResponse[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<CompanyResponse[]>;
}

export async function createCompany(request: CreateCompanyRequest): Promise<CompanyResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<CompanyResponse>;
}

export async function updateCompany(id: string, request: UpdateCompanyRequest): Promise<CompanyResponse> {
  const url = `${BASE}/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, url);
  return res.json() as Promise<CompanyResponse>;
}

export async function deleteCompany(id: string): Promise<void> {
  const url = `${BASE}/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw await parseApiErrorResponse(res, url);
}
