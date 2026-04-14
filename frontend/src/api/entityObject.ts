import { parseApiErrorResponse } from "./errors";

export interface EntityObjectResponse {
  id: number;
  name: string;
  createdAt: string;
}

export interface EntityObjectCreateRequest {
  name: string;
  description: string;
  reference: string;
  project_id: number;
}

export interface EntityObjectUpdateRequest {
  name: string;
  description: string;
  reference: string;
  project_id: number;
}

const BASE = "/api/entity-objects";

export async function listEntityObjects(): Promise<EntityObjectResponse[]> {
  const res = await fetch(BASE);

  if (!res.ok) {
    throw await parseApiErrorResponse(res, BASE);
  }

  return res.json() as Promise<EntityObjectResponse[]>;
}

export async function createEntityObject(
  body: EntityObjectCreateRequest,
): Promise<EntityObjectResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseApiErrorResponse(res, BASE);
  }

  return res.json() as Promise<EntityObjectResponse>;
}

export async function updateEntityObject(
  id: number,
  body: EntityObjectUpdateRequest,
): Promise<EntityObjectResponse> {
  const endpoint = `${BASE}/${id}`;

  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseApiErrorResponse(res, endpoint);
  }

  return res.json() as Promise<EntityObjectResponse>;
}

export async function getEntityObjectById(
  id: number,
): Promise<EntityObjectResponse> {
  const endpoint = `${BASE}/${id}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw await parseApiErrorResponse(res, endpoint);
  }

  return res.json() as Promise<EntityObjectResponse>;
}