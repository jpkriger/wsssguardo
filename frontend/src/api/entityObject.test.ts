import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import { createEntityObject, listEntityObjects } from "./entityObject";

describe("entityObject api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listEntityObjects returns parsed payload when request succeeds", async () => {
    const payload = [
      { id: 1, name: "First", createdAt: "2026-03-21T00:00:00Z" },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await expect(listEntityObjects()).resolves.toEqual(payload);
  });

  it("createEntityObject sends JSON payload and returns created item", async () => {
    const payload = {
      id: 2,
      name: "Second",
      createdAt: "2026-03-21T00:00:00Z",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 201 }),
      );

    const request: Parameters<typeof createEntityObject>[0] = {
      name: "Second",
      description: "desc",
      reference: "ref",
      project_id: 1,
    };

    await expect(createEntityObject(request)).resolves.toEqual(payload);

    expect(fetchSpy).toHaveBeenCalledWith("/api/entity-objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  });

  it("listEntityObjects throws structured error when backend returns ApiErrorResponse", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 400,
          error: "Bad Request",
          message: "name: name is required",
          timestamp: "2026-03-27T15:30:45.123456Z",
          path: "/api/entity-objects",
        }),
        { status: 400 },
      ),
    );

    const request = listEntityObjects();

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 400,
      errorType: "Bad Request",
      message: "name: name is required",
      path: "/api/entity-objects",
    });
  });

  it("createEntityObject falls back to generic structured error when body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("gateway timeout", {
        status: 504,
        statusText: "Gateway Timeout",
      }),
    );

    const request = createEntityObject({ name: "Second", description: "desc", reference: "ref", project_id: 1 });

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 504,
      errorType: "Gateway Timeout",
      path: "/api/entity-objects",
    });
  });
});
