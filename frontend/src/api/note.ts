import apiClient from "@/lib/api-client";
import { ArtifactContentTypes } from "./artifact";

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

const BASE = "artifacts";

export function createNote(body: NoteCreateRequest): Promise<NoteResponse> {
  return apiClient
    .post(BASE, {
      json: {
        name: body.title,
        description: body.content,
        contentType: ArtifactContentTypes.Note,
      },
    })
    .json<NoteResponse>();
}
