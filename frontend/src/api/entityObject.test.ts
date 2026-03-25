import { afterEach, describe, expect, it, vi } from "vitest";

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

    await expect(createEntityObject({ name: "Second" })).resolves.toEqual(
      payload,
    );

    expect(fetchSpy).toHaveBeenCalledWith("/api/entity-objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Second" }),
    });
  });

  it("listEntityObjects throws when request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    await expect(listEntityObjects()).rejects.toThrow("Failed to fetch: 500");
  });
});
