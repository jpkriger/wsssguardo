import { parseApiErrorResponse } from "./errors";

export interface AssetResponse {
    id: string;
    name: string;
    description: string;
    content: string;
    projectId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
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

const BASE = "/api/assets";

export async function fetchAssetsByProject(
    projectId: string,
    page: number = 0,
    size: number = 5,
): Promise<AssetPageResponse> {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    const url = `${BASE}/project/${projectId}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw await parseApiErrorResponse(res, url);

    return res.json() as Promise<AssetPageResponse>;
}

export async function deleteAsset(id: string): Promise<void> {
    const url = `${BASE}/${id}`;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) throw await parseApiErrorResponse(res, url);
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

export async function createAsset(data: AssetCreateRequest): Promise<AssetResponse> {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw await parseApiErrorResponse(res, BASE);

    return res.json() as Promise<AssetResponse>;
}

export async function updateAsset(id: string, data: AssetUpdateRequest): Promise<AssetResponse> {
    const url = `${BASE}/${id}`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw await parseApiErrorResponse(res, url);

    return res.json() as Promise<AssetResponse>;
}
