import apiClient from "@/lib/api-client";

export type RiskPriority = "P1" | "P2" | "P3" | "P4" | "P5";

export interface RiskResponse {
    id: string;
    projectId: string;
    name: string;
    findIds: string[];
    description: string;
    consequences: string;
    occurrenceProbability: number;
    impactProbability: number;
    damageOperations: number;
    damageIndividuals: number;
    damageOtherOrgs: number;
    damageAssets: number;
    generalRisk: number;
    recommendation: string;
    priority: RiskPriority;
    aiSummary?: string | null;
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
    name: string;
    findIds: string[];
    description: string;
    consequences: string;
    occurrenceProbability: number;
    impactProbability: number;
    damageOperations: number;
    damageIndividuals: number;
    damageOtherOrgs: number;
    damageAssets: number;
    recommendation: string;
    priority: RiskPriority;
}

export interface RiskUpdateRequest {
    name?: string;
    description?: string;
    consequences?: string;
    occurrenceProbability?: number;
    impactProbability?: number;
    damageOperations?: number;
    findIds?: string[];
    damageIndividuals?: number;
    damageOtherOrgs?: number;
    damageAssets?: number;
    recommendation?: string;
    priority?: RiskPriority;
}

function base(projectId: string): string {
    return `projects/${projectId}/risks`;
}

export function fetchRisksByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<RiskPageResponse> {
    return apiClient
        .get(base(projectId), {
            searchParams: { page: String(page), size: String(size) },
        })
        .json<RiskPageResponse>();
}

export async function fetchAllRisksByProject(
    projectId: string,
): Promise<RiskResponse[]> {
    const PAGE_SIZE = 100;
    const all: RiskResponse[] = [];
    let page = 0;
    for (;;) {
        const res = await fetchRisksByProject(projectId, page, PAGE_SIZE);
        all.push(...res.content);
        if (res.last || res.content.length === 0) break;
        page += 1;
    }
    return all;
}

export function createRisk(projectId: string, data: RiskCreateRequest): Promise<RiskResponse> {
    return apiClient.post(base(projectId), { json: data }).json<RiskResponse>();
}

export function updateRisk(projectId: string, id: string, data: RiskUpdateRequest): Promise<RiskResponse> {
    return apiClient.put(`${base(projectId)}/${id}`, { json: data }).json<RiskResponse>();
}

export async function deleteRisk(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`${base(projectId)}/${id}`);
}

export interface RiskSummaryResponse {
    total: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
}

export function getRiskSummary(projectId: string): Promise<RiskSummaryResponse> {
    return apiClient.get(`${base(projectId)}/summary`).json<RiskSummaryResponse>();
}

export function suggestRiskScore(projectId: string, riskId: string): Promise<{ score: number }> {
    return apiClient.post(`${base(projectId)}/${riskId}/ai/suggest-score`, { timeout: false }).json<{ score: number }>();
}

export function summarizeRisk(projectId: string, riskId: string): Promise<{ summary: string }> {
    return apiClient.post(`${base(projectId)}/${riskId}/ai/summarize`, { timeout: false }).json<{ summary: string }>();
}
