import { ApiErrorResponse, parseApiErrorResponse } from "./errors";
import type { ProjectResponse } from "./project";

const BASE = "/api/reports";
const GENERATE_URL = `${BASE}/generate`;

export const REPORT_SECTIONS = [
  "cover",
  "projectOverview",
  "findings",
  "risks",
  "assets",
  "recommendations",
  "appendix",
] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];

export type ReportDetailLevel = "summary" | "standard" | "detailed";

export interface ReportEditableFields {
  title?: string;
  subtitle?: string;
  introduction?: string;
  executiveSummary?: string;
  conclusion?: string;
  footerNote?: string;
}

export interface GenerateReportRequest {
  projectId: string;
  selectedSections: readonly ReportSection[];
  detailLevel: ReportDetailLevel;
  editableFields?: ReportEditableFields;
}

export interface ReportArtifact {
  url: string;
  contentType: string;
  fileName: string;
}

export interface GenerateReportResponse {
  reportId: string;
  projectId: string;
  status: string;
  generatedAt: string;
  selectedSections: readonly ReportSection[];
  detailLevel: ReportDetailLevel;
  artifacts: {
    pdf: ReportArtifact;
    html: ReportArtifact;
  };
}

export function buildReportRequest(
  project: Pick<ProjectResponse, "id" | "name">,
): GenerateReportRequest {
  return {
    projectId: project.id,
    selectedSections: [...REPORT_SECTIONS],
    detailLevel: "standard",
    editableFields: {
      title: `Relatório de ${project.name}`,
      subtitle: `Projeto ${project.name}`,
    },
  };
}

export async function generateReport(
  request: GenerateReportRequest,
): Promise<GenerateReportResponse> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw await parseApiErrorResponse(res, GENERATE_URL);

  return res.json() as Promise<GenerateReportResponse>;
}

async function downloadArtifact(artifact: ReportArtifact): Promise<void> {
  const res = await fetch(artifact.url);

  if (!res.ok) {
    throw await parseApiErrorResponse(res, artifact.url);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = artifact.fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadReportArtifacts(
  report: GenerateReportResponse,
): Promise<void> {
  const results = await Promise.allSettled([
    downloadArtifact(report.artifacts.pdf),
    downloadArtifact(report.artifacts.html),
  ]);

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length > 0) {
    throw new Error(
      failures
        .map((failure) =>
          failure.reason instanceof Error
            ? failure.reason.message
            : "Falha ao baixar um dos arquivos do relatório",
        )
        .join(" "),
    );
  }
}

export function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiErrorResponse) {
    if (error.status === 404 && /No endpoint:/i.test(error.message)) {
      return "A exportação de relatórios não está disponível neste ambiente.";
    }

    return `Não foi possível gerar o relatório: ${error.getUserMessage()}`;
  }

  if (error instanceof Error) {
    return `Não foi possível gerar o relatório: ${error.message}`;
  }

  return "Falha ao gerar o relatório. Tente novamente.";
}
