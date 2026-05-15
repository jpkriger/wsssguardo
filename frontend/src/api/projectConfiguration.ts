import { parseApiErrorResponse } from "./errors";

export interface RiskCategoryDTO {
  label: string;
  minRange: number;
  maxRange: number;
}

export interface RiskConfigDTO {
  minRange: number;
  maxRange: number;
  categories: RiskCategoryDTO[];
}

export interface ProjectConfigurationDTO {
  riskConfig: RiskConfigDTO;
}

const BASE = "/api/projects";

export async function getProjectConfiguration(projectId: string): Promise<ProjectConfigurationDTO> {
  const url = `${BASE}/${projectId}/configuration`;
  const res = await fetch(url);
  if (!res.ok) throw await parseApiErrorResponse(res, url);
  return res.json() as Promise<ProjectConfigurationDTO>;
}
