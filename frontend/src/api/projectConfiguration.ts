import apiClient from "@/lib/api-client";

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

const BASE = "projects";

export function getProjectConfiguration(projectId: string): Promise<ProjectConfigurationDTO> {
  return apiClient.get(`${BASE}/${projectId}/configuration`).json<ProjectConfigurationDTO>();
}
