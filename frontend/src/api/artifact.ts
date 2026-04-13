import apiClient from "../lib/api-client";

export const ArtifactContentTypes = {
  Document: "document",
  Image: "image",
  Note: "note",
  Sheet: "sheet",
} as const;

export type ArtifactContentType =
  (typeof ArtifactContentTypes)[keyof typeof ArtifactContentTypes];

const CONTENT_TYPE_TO_BACKEND: Record<ArtifactContentType, string> = {
  document: "DOCUMENT",
  image: "IMAGE",
  note: "NOTE",
  sheet: "SHEET",
};

const BACKEND_TO_CONTENT_TYPE: Record<string, ArtifactContentType> = {
  DOCUMENT: "document",
  IMAGE: "image",
  NOTE: "note",
  SHEET: "sheet",
};

export interface ArtifactResponse {
  id: string;
  name: string;
  contentType: ArtifactContentType;
  author: string;
  createdAt: string;
  updatedAt?: string;
  description: string;
  fileLabel?: string;
  category?: string;
  content?: string;
  driveLink?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  findings?: { high: number; medium: number; low: number };
}

export interface ArtifactCreateRequest {
  name: string;
  description?: string;
  content?: string;
  category?: string;
  driveLink?: string;
  contentType: ArtifactContentType;
}

export interface ArtifactUpdateRequest {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  driveLink?: string;
  contentType?: ArtifactContentType;
}

export interface ArtifactFilterState {
  search: string;
  contentType: ArtifactContentType | "";
  author: string;
}

interface BackendArtifactResponse {
  id: string;
  name: string;
  description: string | null;
  content: string | null;
  category: string | null;
  driveLink: string | null;
  llmSummary: string | null;
  type: string;
  projectId: string;
  createdBy: string | null;
  lastModifiedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toFrontend(dto: BackendArtifactResponse): ArtifactResponse {
  const contentType: ArtifactContentType =
    BACKEND_TO_CONTENT_TYPE[dto.type] ?? "document";

  const fileLabelMap: Record<ArtifactContentType, string> = {
    document: "DOC",
    image: "IMG",
    note: "NOTA",
    sheet: "PLANILHA",
  };

  return {
    id: dto.id,
    name: dto.name,
    contentType,
    author: dto.createdBy ?? "—",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? undefined,
    description: dto.description ?? "",
    fileLabel: fileLabelMap[contentType],
    category: dto.category ?? undefined,
    content: dto.content ?? undefined,
    driveLink: dto.driveLink ?? undefined,
    lastEditedBy: dto.lastModifiedBy ?? undefined,
    lastEditedAt: dto.updatedAt ?? undefined,
  };
}

function toBackendCreate(req: ArtifactCreateRequest) {
  return {
    name: req.name,
    description: req.description,
    content: req.content,
    category: req.category,
    driveLink: req.driveLink,
    type: CONTENT_TYPE_TO_BACKEND[req.contentType],
  };
}

function toBackendUpdate(req: ArtifactUpdateRequest) {
  return {
    name: req.name,
    description: req.description,
    content: req.content,
    category: req.category,
    driveLink: req.driveLink,
    ...(req.contentType !== undefined
      ? { type: CONTENT_TYPE_TO_BACKEND[req.contentType] }
      : {}),
  };
}

const base = (projectId: string) => `projects/${projectId}/artifacts`;

export function listArtifacts(projectId: string): Promise<ArtifactResponse[]> {
  return apiClient
    .get(`${base(projectId)}/listByProject/`)
    .json<BackendArtifactResponse[]>()
    .then((list) => list.map(toFrontend));
}

export function getArtifact(
  projectId: string,
  id: string
): Promise<ArtifactResponse> {
  return apiClient
    .get(`${base(projectId)}/get/${id}`)
    .json<BackendArtifactResponse>()
    .then(toFrontend);
}

export function createArtifact(
  projectId: string,
  request: ArtifactCreateRequest
): Promise<ArtifactResponse> {
  return apiClient
    .post(`${base(projectId)}/create/`, { json: toBackendCreate(request) })
    .json<BackendArtifactResponse>()
    .then(toFrontend);
}

export function updateArtifact(
  projectId: string,
  id: string,
  request: ArtifactUpdateRequest
): Promise<ArtifactResponse> {
  return apiClient
    .put(`${base(projectId)}/${id}`, { json: toBackendUpdate(request) })
    .json<BackendArtifactResponse>()
    .then(toFrontend);
}

export function deleteArtifact(projectId: string, id: string): Promise<void> {
  return apiClient.delete(`${base(projectId)}/delete/${id}`).then(() => undefined);
}
