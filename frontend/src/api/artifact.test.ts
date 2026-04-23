import { afterEach, describe, expect, it, vi } from "vitest";

import { getArtifact, listArtifacts } from "./artifact";

describe("artifact api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listArtifacts maps llmSummary to riskSummary", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "artifact-1",
            name: "Nota Redes",
            description: "VPN",
            content: "Certificados compartilhados.",
            category: "Rede",
            driveLink: null,
            llmSummary: "Certificados genericos VPN.",
            type: "NOTE",
            projectId: "project-1",
            createdBy: "system_seed",
            lastModifiedBy: null,
            createdAt: "2026-04-18T10:00:00Z",
            updatedAt: null,
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(listArtifacts("project-1")).resolves.toEqual([
      expect.objectContaining({
        id: "artifact-1",
        contentType: "note",
        riskSummary: "Certificados genericos VPN.",
      }),
    ]);
  });

  it("getArtifact omits riskSummary when backend returns null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "artifact-2",
          name: "Relatorio Pentest",
          description: "Google Drive",
          content: null,
          category: null,
          driveLink: "https://drive.google.com/file1",
          llmSummary: null,
          type: "DOCUMENT",
          projectId: "project-1",
          createdBy: "system_seed",
          lastModifiedBy: "analyst",
          createdAt: "2026-04-18T10:00:00Z",
          updatedAt: "2026-04-19T10:00:00Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(getArtifact("project-1", "artifact-2")).resolves.toEqual(
      expect.objectContaining({
        id: "artifact-2",
        contentType: "document",
        riskSummary: undefined,
      }),
    );
  });
});
