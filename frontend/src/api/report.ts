export type ReportGenerateRequest = {
  projectId: string;
  selectedSections?: string[];
  detailLevel?: 'summary' | 'standard' | 'detailed';
  editableFields?: Record<string,string>;
}

export type ReportArtifact = { url: string; contentType: string; fileName: string };
export type ReportGenerateResponse = { reportId: string; projectId: string; status: string; generatedAt: string; artifacts: Record<string,ReportArtifact> };

export async function generateReport(req: ReportGenerateRequest): Promise<ReportGenerateResponse> {
  const res = await fetch('/api/reports/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
