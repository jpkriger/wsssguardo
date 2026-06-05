import apiClient from "@/lib/api-client";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface FindingResponse {
  id: string;
  name: string;
  description?: string;
  numericSeverity?: number;
  categoricalSeverity?: FindingSeverity;
  category?: string;
  reference?: string;
  projectId: string;
  linkedAssetIds: string[];
  linkedArtifactIds: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FindingCreateRequest {
  name: string;
  description?: string;
  numericSeverity?: number;
  categoricalSeverity?: FindingSeverity;
  category?: string;
  reference?: string;
  linkedAssetIds?: string[];
  linkedArtifactIds?: string[];
}

export interface FindingUpdateRequest {
  name?: string;
  description?: string;
  numericSeverity?: number;
  categoricalSeverity?: FindingSeverity;
  category?: string;
  reference?: string;
  linkedAssetIds?: string[];
  linkedArtifactIds?: string[];
}

function base(projectId: string): string {
  return `projects/${projectId}/findings`;
}

export function listFindings(projectId: string): Promise<FindingResponse[]> {
  return apiClient.get(`${base(projectId)}/listByProject/`).json<FindingResponse[]>();
}

export function getFinding(projectId: string, id: string): Promise<FindingResponse> {
  return apiClient.get(`${base(projectId)}/get/${id}`).json<FindingResponse>();
}

export function createFinding(
  projectId: string,
  body: FindingCreateRequest,
): Promise<FindingResponse> {
  return apiClient.post(`${base(projectId)}/create/`, { json: body }).json<FindingResponse>();
}

export function updateFinding(
  projectId: string,
  id: string,
  body: FindingUpdateRequest,
): Promise<FindingResponse> {
  return apiClient.put(`${base(projectId)}/${id}`, { json: body }).json<FindingResponse>();
}

export async function deleteFinding(projectId: string, id: string): Promise<void> {
  await apiClient.delete(`${base(projectId)}/delete/${id}`);
}
