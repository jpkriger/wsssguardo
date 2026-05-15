import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import { listFindings, createFinding } from "./finding";

const PROJECT_ID = "018f2f32-ff0a-7c30-9dfa-a9f765432101";

describe("finding api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listFindings returns parsed payload when request succeeds", async () => {
    const payload = [
      {
        id: "018f2f32-ff0a-7c30-9dfa-a9f765432201",
        name: "SQL Injection",
        description: "Unsanitized query input",
        numericSeverity: 9,
        categoricalSeverity: "CRITICAL",
        category: "Injection",
        reference: "CWE-89",
        projectId: PROJECT_ID,
        linkedAssetIds: [],
        linkedArtifactIds: [],
        createdBy: "analyst",
        createdAt: "2026-04-01T10:00:00Z",
      },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(listFindings(PROJECT_ID)).resolves.toEqual(payload);
    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/projects/${PROJECT_ID}/findings/listByProject/`,
    );
  });

  it("listFindings throws structured error when backend returns 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          error: "Not Found",
          message: "Project not found for id: " + PROJECT_ID,
          timestamp: "2026-04-01T10:00:00Z",
          path: `/api/projects/${PROJECT_ID}/findings/listByProject/`,
        }),
        { status: 404 },
      ),
    );

    const request = listFindings(PROJECT_ID);

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 404,
      errorType: "Not Found",
    });
  });

  it("createFinding sends JSON payload and returns created finding", async () => {
    const payload = {
      id: "018f2f32-ff0a-7c30-9dfa-a9f765432202",
      name: "XSS",
      description: "Stored XSS via note content",
      numericSeverity: 7,
      categoricalSeverity: "HIGH",
      category: "Injection",
      reference: "CWE-79",
      projectId: PROJECT_ID,
      linkedAssetIds: [],
      linkedArtifactIds: [],
      createdBy: "analyst",
      createdAt: "2026-04-01T10:00:00Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 201 }));

    const request = { name: "XSS", categoricalSeverity: "HIGH" as const };
    await expect(createFinding(PROJECT_ID, request)).resolves.toEqual(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/projects/${PROJECT_ID}/findings/create/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
  });

  it("createFinding throws structured error when backend returns 400", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 400,
          error: "Bad Request",
          message: "name: name must not be blank",
          timestamp: "2026-04-01T10:00:00Z",
          path: `/api/projects/${PROJECT_ID}/findings/create/`,
        }),
        { status: 400 },
      ),
    );

    const request = createFinding(PROJECT_ID, { name: "" });

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 400,
      errorType: "Bad Request",
      message: "name: name must not be blank",
    });
  });
});
