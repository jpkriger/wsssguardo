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
