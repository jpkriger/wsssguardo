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

const BASE = "/api/artifacts";

export async function createNote(body: NoteCreateRequest): Promise<NoteResponse> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.title,
      description: body.content,
      contentType: "note",
    }),
  });
  if (!res.ok) throw await parseApiErrorResponse(res, BASE);
  return res.json() as Promise<NoteResponse>;
}