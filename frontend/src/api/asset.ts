import apiClient from "@/lib/api-client";

export interface AssetResponse {
    id: string;
    name: string;
    description: string;
    content: string;
    projectId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    findingsCount: number;
}

export interface AssetPageResponse {
    content: AssetResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

const BASE = "assets";

export function fetchAssetsByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<AssetPageResponse> {
    return apiClient
        .get(`${BASE}/project/${projectId}`, {
            searchParams: { page: String(page), size: String(size) },
        })
        .json<AssetPageResponse>();
}

export async function deleteAsset(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
}

export interface AssetCreateRequest {
    projectId: string;
    name: string;
    description: string;
    content: string;
}

export interface AssetUpdateRequest {
    name?: string;
    description?: string;
    content?: string;
}

export function createAsset(data: AssetCreateRequest): Promise<AssetResponse> {
    return apiClient.post(BASE, { json: data }).json<AssetResponse>();
}

export function updateAsset(id: string, data: AssetUpdateRequest): Promise<AssetResponse> {
    return apiClient.patch(`${BASE}/${id}`, { json: data }).json<AssetResponse>();
}
