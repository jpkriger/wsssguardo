import { parseApiErrorResponse } from "./errors";

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

const BASE = "/api/risks";

export async function fetchRisksByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<RiskPageResponse> {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    const url = `${BASE}/project/${projectId}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw await parseApiErrorResponse(res, url);

    return res.json() as Promise<RiskPageResponse>;
}

export async function createRisk(data: RiskCreateRequest): Promise<RiskResponse> {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw await parseApiErrorResponse(res, BASE);

    return res.json() as Promise<RiskResponse>;
}

export async function updateRisk(id: string, data: RiskUpdateRequest): Promise<RiskResponse> {
    const url = `${BASE}/${id}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw await parseApiErrorResponse(res, url);

    return res.json() as Promise<RiskResponse>;
}

export async function deleteRisk(id: string): Promise<void> {
    const url = `${BASE}/${id}`;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) throw await parseApiErrorResponse(res, url);
}
