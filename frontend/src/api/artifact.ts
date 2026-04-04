import { parseApiErrorResponse } from "./errors";

export type ArtifactContentType = "document" | "image" | "note";

export interface ArtifactResponse {
  id: number;
  name: string;
  contentType: ArtifactContentType;
  author: string;
  createdAt: string;
  description: string;
}

const BASE = "/api/artifacts";

export async function listArtifacts(): Promise<ArtifactResponse[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<ArtifactResponse[]>;
}
