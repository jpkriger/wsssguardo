import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import { createProject, listProjects, projectsById, projectsByUserId } from "./project";

function requestOf(spy: { mock: { calls: unknown[][] } }, call = 0): Request {
  return spy.mock.calls[call][0] as Request;
}

describe("project api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listProjects returns all projects payload", async () => {
    const payload = [
      {
        id: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
        name: "Mobile App",
        companyId: "018f2f32-ff0a-7c30-9dfa-a9f765432103",
        startDate: "2026-03-22",
        endDate: "2026-12-22",
        status: "IN_PROGRESS",
      },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(listProjects()).resolves.toEqual(payload);
    expect(new URL(requestOf(fetchSpy).url).pathname).toBe("/api/projects");
  });

  it("projectsById returns empty list when no ids are provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(projectsById([])).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("projectsById sends repeated ids and returns parsed payload", async () => {
    const secondId = "018f2f32-ff0a-7c30-9dfa-a9f765432101";
    const firstId = "018f2f32-ff0a-7c30-9dfa-a9f765432102";
    const companyId = "018f2f32-ff0a-7c30-9dfa-a9f765432103";

    const payload = [
      {
        id: secondId,
        name: "Mobile App",
        companyId,
        startDate: "2026-03-22",
        endDate: "2026-12-22",
        status: "IN_PROGRESS",
      },
      {
        id: firstId,
        name: "Alpha Platform",
        companyId,
        startDate: "2026-03-21",
        endDate: "2026-12-21",
        status: "COMPLETED",
      },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(projectsById([secondId, firstId])).resolves.toEqual(payload);

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toBe("/api/projects");
    expect(url.searchParams.getAll("ids")).toEqual([secondId, firstId]);
  });

  it("projectsById throws structured error when backend returns api error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          error: "Not Found",
          message: "No projects found",
          timestamp: "2026-03-27T15:30:45.123456Z",
          path: "/api/projects",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );

    const request = projectsById(["018f2f32-ff0a-7c30-9dfa-a9f765432199"]);

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 404,
      errorType: "Not Found",
      message: "No projects found",
      path: "/api/projects",
    });
  });

  it("projectsByUserId returns project ids for a user", async () => {
    const userId = "018f2f32-ff0a-7c30-9dfa-a9f765432188";
    const payload = [
      "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      "018f2f32-ff0a-7c30-9dfa-a9f765432102",
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(projectsByUserId(userId)).resolves.toEqual(payload);

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toBe("/api/projects");
    expect(url.searchParams.get("userId")).toBe(userId);
  });

  it("projectsByUserId throws structured error when backend returns api error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          error: "Not Found",
          message: "User not found",
          timestamp: "2026-03-27T15:30:45.123456Z",
          path: "/api/projects",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );

    const request = projectsByUserId("018f2f32-ff0a-7c30-9dfa-a9f765432199");

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 404,
      errorType: "Not Found",
      message: "User not found",
      path: "/api/projects",
    });
  });

  it("createProject sends riskConfig in POST body", async () => {
    const payload = {
      id: "018f2f32-ff0a-7c30-9dfa-a9f765432201",
      name: "New Audit",
      companyId: "018f2f32-ff0a-7c30-9dfa-a9f765432103",
      startDate: "2026-04-01",
      endDate: "2026-06-01",
      status: "IN_PROGRESS",
    };

    const riskConfig = {
      minRange: 0,
      maxRange: 10,
      categories: [
        { label: "Baixo", minRange: 0, maxRange: 3 },
        { label: "Médio", minRange: 4, maxRange: 7 },
        { label: "Alto", minRange: 8, maxRange: 10 },
      ],
    };

    const request = {
      name: "New Audit",
      companyId: "018f2f32-ff0a-7c30-9dfa-a9f765432103",
      startDate: "2026-04-01",
      endDate: "2026-06-01",
      riskConfig,
    };

    let sentBody: unknown;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        sentBody = await (input as Request).clone().json();
        return new Response(JSON.stringify(payload), { status: 201 });
      });

    await expect(createProject(request)).resolves.toEqual(payload);

    const sent = requestOf(fetchSpy);
    expect(new URL(sent.url).pathname).toBe("/api/projects");
    expect(sent.method).toBe("POST");
    expect(sent.headers.get("Content-Type")).toBe("application/json");
    expect(sentBody).toEqual(request);
  });
});
