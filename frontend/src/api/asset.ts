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

/**
 * Fetches every asset of a project by paging through the server response.
 * Used by the client-mode table so sorting/search/filters operate on the full set.
 */
export async function fetchAllAssetsByProject(
    projectId: string,
): Promise<AssetResponse[]> {
    const PAGE_SIZE = 100;
    const all: AssetResponse[] = [];
    let page = 0;
    for (;;) {
        const res = await fetchAssetsByProject(projectId, page, PAGE_SIZE);
        all.push(...res.content);
        if (res.last || res.content.length === 0) break;
        page += 1;
    }
    return all;
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
