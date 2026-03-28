import { parseApiErrorResponse } from "./errors";

export interface EntityObjectResponse {
  id: number;
  name: string;
  createdAt: string;
}

export interface EntityObjectCreateRequest {
  name: string;
}

const BASE = "/api/entity-objects";

export async function listEntityObjects(): Promise<EntityObjectResponse[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
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
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<EntityObjectResponse>;
}
