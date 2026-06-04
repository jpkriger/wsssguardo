import apiClient from "@/lib/api-client";
import type { ProjectResponse as ApiProjectResponse } from "./project";

const BASE = "customers";

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

export function listCompanies(): Promise<CompanyResponse[]> {
  return apiClient.get(BASE).json<CompanyResponse[]>();
}

export function createCompany(request: CreateCompanyRequest): Promise<CompanyResponse> {
  return apiClient.post(BASE, { json: request }).json<CompanyResponse>();
}

export function updateCompany(id: string, request: UpdateCompanyRequest): Promise<CompanyResponse> {
  return apiClient.patch(`${BASE}/${id}`, { json: request }).json<CompanyResponse>();
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
