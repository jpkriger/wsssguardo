import apiClient from "@/lib/api-client";
import type { RiskConfigDTO } from "./projectConfiguration";

export type ProjectStatus = "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

export interface ProjectResponse {
  id: string;
  name: string;
  companyId: string;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  consultantIds: string[];
}

export interface CreateProjectRequest {
  name: string;
  companyId: string;
  startDate: string | null;
  endDate: string | null;
  riskConfig: RiskConfigDTO;
  consultantIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: ProjectStatus;
  consultantIds?: string[];
}

const BASE = "projects";

export function listProjects(): Promise<ProjectResponse[]> {
  return apiClient.get(BASE).json<ProjectResponse[]>();
}

export function projectsById(ids: string[]): Promise<ProjectResponse[]> {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }

  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids", String(id)));

  return apiClient.get(BASE, { searchParams: params }).json<ProjectResponse[]>();
}

export function projectsByUserId(userId: string): Promise<string[]> {
  return apiClient.get(BASE, { searchParams: { userId } }).json<string[]>();
}

export function createProject(request: CreateProjectRequest): Promise<ProjectResponse> {
  return apiClient.post(BASE, { json: request }).json<ProjectResponse>();
}

export function updateProject(id: string, request: UpdateProjectRequest): Promise<ProjectResponse> {
  return apiClient.patch(`${BASE}/${id}`, { json: request }).json<ProjectResponse>();
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export interface ProjectSummaryDTO {
  assetCount: number;
  artifactCount: number;
  findingCount: number;
  riskCount: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  deadlineDate: string | null;
  daysRemaining: number | null;
}

export function getProjectSummary(projectId: string): Promise<ProjectSummaryDTO> {
  return apiClient.get(`${BASE}/${projectId}/summary`).json<ProjectSummaryDTO>();
}

export function summarizeReport(
  projectId: string,
  summaries: string[],
  reportType: "executivo" | "tecnico",
): Promise<{ reportSummary: string }> {
  return apiClient
    .post(`${BASE}/${projectId}/ai/report-summary`, { json: { summaries, reportType }, timeout: false })
    .json<{ reportSummary: string }>();
}
