import { parseApiErrorResponse } from "./errors";

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
  return `/api/projects/${projectId}/findings`;
}

export async function listFindings(projectId: string): Promise<FindingResponse[]> {
  const endpoint = `${base(projectId)}/listByProject/`;
  const res = await fetch(endpoint);
  if (!res.ok) throw await parseApiErrorResponse(res, endpoint);
  return res.json() as Promise<FindingResponse[]>;
}

export async function getFinding(projectId: string, id: string): Promise<FindingResponse> {
  const endpoint = `${base(projectId)}/get/${id}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw await parseApiErrorResponse(res, endpoint);
  return res.json() as Promise<FindingResponse>;
}

export async function createFinding(
  projectId: string,
  body: FindingCreateRequest,
): Promise<FindingResponse> {
  const endpoint = `${base(projectId)}/create/`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, endpoint);
  return res.json() as Promise<FindingResponse>;
}

export async function updateFinding(
  projectId: string,
  id: string,
  body: FindingUpdateRequest,
): Promise<FindingResponse> {
  const endpoint = `${base(projectId)}/${id}`;
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, endpoint);
  return res.json() as Promise<FindingResponse>;
}

export async function deleteFinding(projectId: string, id: string): Promise<void> {
  const endpoint = `${base(projectId)}/delete/${id}`;
  const res = await fetch(endpoint, { method: "DELETE" });
  if (!res.ok) throw await parseApiErrorResponse(res, endpoint);
}
