import { ArtifactContentTypes } from "./artifact";
import { parseApiErrorResponse } from "./errors";

export interface NoteCreateRequest {
  title: string;
  content: string;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/artifacts`;

export async function createNote(body: NoteCreateRequest): Promise<NoteResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.title,
      description: body.content,
      contentType: ArtifactContentTypes.Note,
    }),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<NoteResponse>;
}