import apiClient from "@/lib/api-client";

export interface RiskResponse {
    id: string;
    projectId: string;
    name: string;
    findIds: string[];
    description: string;
    consequences: string;
    occurrenceProbability: number;
    impactProbability: number;
    damageOperations: string;
    damageAssetIds: string[];
    damageIndividuals: string;
    damageOtherOrgs: string;
    recommendation: string;
    riskLevel: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface RiskPageResponse {
    content: RiskResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface RiskCreateRequest {
    projectId: string;
    name: string;
    findIds: string[];
    description: string;
    consequences: string;
    occurrenceProbability: number;
    impactProbability: number;
    damageOperations: string;
    damageAssetIds: string[];
    damageIndividuals: string;
    damageOtherOrgs: string;
    recommendation: string;
    riskLevel: number;
}

export interface RiskUpdateRequest {
    name?: string;
    description?: string;
    consequences?: string;
    occurrenceProbability?: number;
    impactProbability?: number;
    damageOperations?: string;
    findIds?: string[];
    assetIds?: string[];
    damageIndividuals?: string;
    damageOtherOrgs?: string;
    recommendation?: string;
    riskLevel?: number;
}

const BASE = "risks";

export function fetchRisksByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<RiskPageResponse> {
    return apiClient
        .get(`${BASE}/project/${projectId}`, {
            searchParams: { page: String(page), size: String(size) },
        })
        .json<RiskPageResponse>();
}

export function createRisk(data: RiskCreateRequest): Promise<RiskResponse> {
    return apiClient.post(BASE, { json: data }).json<RiskResponse>();
}

export function updateRisk(id: string, data: RiskUpdateRequest): Promise<RiskResponse> {
    return apiClient.put(`${BASE}/${id}`, { json: data }).json<RiskResponse>();
}

export async function deleteRisk(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
}

export interface RiskSummaryResponse {
    total: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
}

export function getRiskSummary(projectId: string): Promise<RiskSummaryResponse> {
    return apiClient.get(`${BASE}/project/${projectId}/summary`).json<RiskSummaryResponse>();
}
