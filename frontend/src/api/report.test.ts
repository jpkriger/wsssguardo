import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiErrorResponse } from "./errors";
import {
  buildReportRequest,
  downloadReportArtifacts,
  getReportErrorMessage,
  generateReport,
} from "./report";

describe("report api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildReportRequest maps project data to the default payload", () => {
    const request = buildReportRequest({
      id: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      name: "Mobile App",
    });

    expect(request).toEqual({
      projectId: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      selectedSections: [
        "cover",
        "projectOverview",
        "findings",
        "risks",
        "assets",
        "recommendations",
        "appendix",
      ],
      detailLevel: "standard",
      editableFields: {
        title: "Relatório de Mobile App",
        subtitle: "Projeto Mobile App",
      },
    });
  });

  it("generateReport sends the report payload and returns parsed response", async () => {
    const request = {
      projectId: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      selectedSections: ["cover", "findings"] as const,
      detailLevel: "detailed" as const,
      editableFields: { title: "Relatório de teste" },
    };

    const payload = {
      reportId: "018f2f32-ff0a-7c30-9dfa-a9f765432199",
      projectId: request.projectId,
      status: "READY",
      generatedAt: "2026-05-24T15:30:00-03:00",
      selectedSections: request.selectedSections,
      detailLevel: request.detailLevel,
      artifacts: {
        pdf: {
          url: "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/pdf",
          contentType: "application/pdf",
          fileName: "relatorio.pdf",
        },
        html: {
          url: "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/html",
          contentType: "text/html; charset=utf-8",
          fileName: "relatorio.html",
        },
      },
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 201 }));

    await expect(generateReport(request)).resolves.toEqual(payload);

    expect(fetchSpy).toHaveBeenCalledWith("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  });

  it("generateReport throws structured error when backend rejects the request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 400,
          error: "Bad Request",
          message: "selectedSections must not be empty",
          timestamp: "2026-05-24T15:30:00Z",
          path: "/api/reports/generate",
        }),
        { status: 400 },
      ),
    );

    const request = {
      projectId: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      selectedSections: ["cover"] as const,
      detailLevel: "summary" as const,
    };

    const response = generateReport(request);

    await expect(response).rejects.toBeInstanceOf(ApiErrorResponse);
    await expect(response).rejects.toMatchObject({
      status: 400,
      errorType: "Bad Request",
      message: "selectedSections must not be empty",
      path: "/api/reports/generate",
    });
  });

  it("downloadReportArtifacts downloads PDF and HTML using the metadata returned by the API", async () => {
    const report = {
      reportId: "018f2f32-ff0a-7c30-9dfa-a9f765432199",
      projectId: "018f2f32-ff0a-7c30-9dfa-a9f765432101",
      status: "READY",
      generatedAt: "2026-05-24T15:30:00-03:00",
      selectedSections: ["cover"] as const,
      detailLevel: "standard" as const,
      artifacts: {
        pdf: {
          url: "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/pdf",
          contentType: "application/pdf",
          fileName: "relatorio.pdf",
        },
        html: {
          url: "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/html",
          contentType: "text/html; charset=utf-8",
          fileName: "relatorio.html",
        },
      },
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("pdf", { status: 200 }))
      .mockResolvedValueOnce(new Response("html", { status: 200 }));

    const links: Array<{
      href: string;
      download: string;
      rel: string;
      style: { display: string };
      click: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    }> = [];

    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        const link = {
          href: "",
          download: "",
          rel: "",
          style: { display: "" },
          click: vi.fn(),
          remove: vi.fn(),
        };
        links.push(link);
        return link;
      }),
      body: {
        appendChild: vi.fn(),
      },
    } as never);

    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:pdf")
      .mockReturnValueOnce("blob:html");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    await expect(downloadReportArtifacts(report)).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/pdf",
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/reports/018f2f32-ff0a-7c30-9dfa-a9f765432199/html",
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ download: "relatorio.pdf", href: "blob:pdf" });
    expect(links[1]).toMatchObject({ download: "relatorio.html", href: "blob:html" });
    expect(links[0].click).toHaveBeenCalledTimes(1);
    expect(links[1].click).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:pdf");
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:html");
  });

  it("getReportErrorMessage returns a friendly message when the endpoint is missing", () => {
    const error = new ApiErrorResponse({
      status: 404,
      error: "Not Found",
      message: "No endpoint: /api/reports/generate",
      timestamp: "2026-05-24T15:30:00Z",
      path: "/api/reports/generate",
    });

    expect(getReportErrorMessage(error)).toBe(
      "A exportação de relatórios não está disponível neste ambiente.",
    );
  });

  it("getReportErrorMessage keeps structured messages for api failures", () => {
    const error = new ApiErrorResponse({
      status: 400,
      error: "Bad Request",
      message: "selectedSections must not be empty",
      timestamp: "2026-05-24T15:30:00Z",
      path: "/api/reports/generate",
    });

    expect(getReportErrorMessage(error)).toBe(
      "Não foi possível gerar o relatório: Dados inválidos: selectedSections must not be empty",
    );
  });
});
