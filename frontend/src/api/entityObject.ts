import apiClient from "@/lib/api-client";

export interface EntityObjectResponse {
  id: string;
  name: string;
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface EntityObjectCreateRequest {
  name: string;
  description: string;
  reference: string;
}

export interface EntityObjectUpdateRequest {
  name: string;
  description: string;
  reference: string;
}

const BASE = "entity-objects";

export function listEntityObjects(): Promise<EntityObjectResponse[]> {
  return apiClient.get(BASE).json<EntityObjectResponse[]>();
}

export function getEntityObjectById(id: string): Promise<EntityObjectResponse> {
  return apiClient.get(`${BASE}/${id}`).json<EntityObjectResponse>();
}

export function createEntityObject(
  body: EntityObjectCreateRequest,
): Promise<EntityObjectResponse> {
  return apiClient.post(BASE, { json: body }).json<EntityObjectResponse>();
}

export function updateEntityObject(
  id: string,
  body: EntityObjectUpdateRequest,
): Promise<EntityObjectResponse> {
  return apiClient.patch(`${BASE}/${id}`, { json: body }).json<EntityObjectResponse>();
}
