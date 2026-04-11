import { parseApiErrorResponse } from "./errors";

export const ArtifactContentTypes = {
  Document: "document",
  Image: "image",
  Note: "note",
} as const;

export type ArtifactContentType = typeof ArtifactContentTypes[keyof typeof ArtifactContentTypes];

export interface ArtifactResponse {
  id: number;
  name: string;
  contentType: ArtifactContentType;
  author: string;
  createdAt: string;
  description: string;
}

export interface ArtifactFilterState {
  search: string;
  contentType: ArtifactContentType | "";
  author: string;
}

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/artifacts`;

export async function listArtifacts(): Promise<ArtifactResponse[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<ArtifactResponse[]>;
}
