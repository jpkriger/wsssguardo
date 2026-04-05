import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import { projectsById } from "./project";

describe("project api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("projectsById sends repeated ids and returns parsed payload", async () => {
    const secondId = "018f2f32-ff0a-7c30-9dfa-a9f765432101";
    const firstId = "018f2f32-ff0a-7c30-9dfa-a9f765432102";
    const customerId = "018f2f32-ff0a-7c30-9dfa-a9f765432103";

    const payload = [
      {
        id: secondId,
        name: "Mobile App",
        customerId,
        startDate: "2026-03-22",
        endDate: "2026-12-22",
        status: "IN_PROGRESS",
      },
      {
        id: firstId,
        name: "Alpha Platform",
        customerId,
        startDate: "2026-03-21",
        endDate: "2026-12-21",
        status: "COMPLETED",
      },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 }),
      );

    await expect(projectsById([secondId, firstId])).resolves.toEqual(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/projectsById?ids=${secondId}&ids=${firstId}`,
    );
  });

  it("projectsById throws structured error when backend returns api error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          error: "Not Found",
          message: "No projects found",
          timestamp: "2026-03-27T15:30:45.123456Z",
          path: "/api/projectsById",
        }),
        { status: 404 },
      ),
    );

    const request = projectsById(["018f2f32-ff0a-7c30-9dfa-a9f765432199"]);

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 404,
      errorType: "Not Found",
      message: "No projects found",
      path: "/api/projectsById",
    });
  });
});
