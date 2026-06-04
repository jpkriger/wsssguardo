import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import { createEntityObject, listEntityObjects } from "./entityObject";

function requestOf(spy: { mock: { calls: unknown[][] } }, call = 0): Request {
  return spy.mock.calls[call][0] as Request;
}

describe("entityObject api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listEntityObjects returns parsed payload when request succeeds", async () => {
    const payload = [
      { id: 1, name: "First", createdAt: "2026-03-21T00:00:00Z" },
    ];

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(listEntityObjects()).resolves.toEqual(payload);
    expect(new URL(requestOf(fetchSpy).url).pathname).toBe("/api/entity-objects");
  });

  it("createEntityObject sends JSON payload and returns created item", async () => {
    const payload = {
      id: 2,
      name: "Second",
      createdAt: "2026-03-21T00:00:00Z",
    };

    let captured: unknown;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      captured = await (input as Request).clone().json();
      return new Response(JSON.stringify(payload), { status: 201 });
    });

    const request: Parameters<typeof createEntityObject>[0] = {
      name: "Second",
      description: "desc",
      reference: "ref",
    };

    await expect(createEntityObject(request)).resolves.toEqual(payload);

    const sent = requestOf(fetchSpy);
    expect(sent.method).toBe("POST");
    expect(new URL(sent.url).pathname).toBe("/api/entity-objects");
    expect(sent.headers.get("content-type")).toContain("application/json");
    expect(captured).toEqual(request);
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

    const request = createEntityObject({ name: "Second", description: "desc", reference: "ref" });

    await expect(request).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 504,
      errorType: "Gateway Timeout",
    });
  });
});
