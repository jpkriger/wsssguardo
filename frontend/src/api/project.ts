import { parseApiErrorResponse } from "./errors";

export interface ProjectResponse {
  id: string;
  name: string;
  customerId: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

const BASE = "/api/projectsById";

export async function projectsById(ids: string[]): Promise<ProjectResponse[]> {
  const params = new URLSearchParams();

  ids.forEach((id) => {
    params.append("ids", String(id));
  });

  const url = params.toString() ? `${BASE}?${params.toString()}` : BASE;
  const res = await fetch(url);

  if (!res.ok) throw await parseApiErrorResponse(res, BASE);

  return res.json() as Promise<ProjectResponse[]>;
}
