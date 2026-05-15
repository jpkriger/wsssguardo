import { parseApiErrorResponse } from "./errors";

export interface ProjectResponse {
  id: string;
  name: string;
  customerId: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface CreateProjectRequest {
  name: string;
  customerId: string;
  startDate: string | null;
  endDate: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
}

const BASE = "/api/projects";

export async function listProjects(): Promise<ProjectResponse[]> {
  const res = await fetch(BASE);

  if (!res.ok) throw await parseApiErrorResponse(res, BASE);

  return res.json() as Promise<ProjectResponse[]>;
}

export async function projectsById(ids: string[]): Promise<ProjectResponse[]> {
  if (ids.length === 0) {
    return [];
  }

  const params = new URLSearchParams();

  ids.forEach((id) => {
    params.append("ids", String(id));
  });

  const url = params.toString() ? `${BASE}?${params.toString()}` : BASE;
  const res = await fetch(url);

  if (!res.ok) throw await parseApiErrorResponse(res, BASE);

  return res.json() as Promise<ProjectResponse[]>;
}

export async function projectsByUserId(userId: string): Promise<string[]> {
  const params = new URLSearchParams({ userId });
  const url = `${BASE}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);

  return res.json() as Promise<string[]>;
}

export async function createProject(request: CreateProjectRequest): Promise<ProjectResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw await parseApiErrorResponse(res, BASE);

  return res.json() as Promise<ProjectResponse>;
}

export async function updateProject(id: string, request: UpdateProjectRequest): Promise<ProjectResponse> {
  const url = `${BASE}/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw await parseApiErrorResponse(res, url);

  return res.json() as Promise<ProjectResponse>;
}

export async function deleteProject(id: string): Promise<void> {
  const url = `${BASE}/${id}`;
  const res = await fetch(url, { method: "DELETE" });

  if (!res.ok) throw await parseApiErrorResponse(res, url);
}
