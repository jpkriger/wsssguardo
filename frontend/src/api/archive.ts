import apiClient, { ApiErrorResponse } from "@/lib/api-client";

export type ArchiveStatus = "PENDING_DOWNLOAD" | "CONFIRMED";

export interface ArchiveManifest {
  id: string;
  projectId: string;
  projectName: string;
  fileName: string;
  sha256: string;
  sizeBytes: number;
  status: ArchiveStatus;
  createdBy: string;
  createdAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export async function downloadProjectArchive(
  projectId: string,
): Promise<{ blob: Blob; fileName: string }> {
  const res = await apiClient.post(`projects/${projectId}/archive`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const fileName = match?.[1] ?? `project-${projectId}.p7m`;
  return { blob, fileName };
}

export async function confirmArchive(projectId: string, sha256: string): Promise<void> {
  await apiClient.post(`projects/${projectId}/archive/confirm`, {
    json: { sha256 },
  });
}

export async function getArchiveManifest(
  projectId: string,
): Promise<ArchiveManifest | null> {
  try {
    return await apiClient
      .get(`projects/${projectId}/archive/manifest`)
      .json<ArchiveManifest>();
  } catch (err) {
    if (err instanceof ApiErrorResponse && err.status === 404) return null;
    throw err;
  }
}

export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
