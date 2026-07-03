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

function base(projectId: string): string {
    return `projects/${projectId}/assets`;
}

export function fetchAssetsByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<AssetPageResponse> {
    return apiClient
        .get(base(projectId), {
            searchParams: { page: String(page), size: String(size) },
        })
        .json<AssetPageResponse>();
}

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

export interface AssetCreateRequest {
    name: string;
    description: string;
    content: string;
}

export interface AssetUpdateRequest {
    name?: string;
    description?: string;
    content?: string;
}

export function createAsset(projectId: string, data: AssetCreateRequest): Promise<AssetResponse> {
    return apiClient.post(base(projectId), { json: data }).json<AssetResponse>();
}

export function updateAsset(projectId: string, id: string, data: AssetUpdateRequest): Promise<AssetResponse> {
    return apiClient.patch(`${base(projectId)}/${id}`, { json: data }).json<AssetResponse>();
}

export async function deleteAsset(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`${base(projectId)}/${id}`);
}
