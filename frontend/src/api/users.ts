import apiClient from "@/lib/api-client";
import type { UserProfile } from "./auth";

export type { UserProfile };

export function listUsers(): Promise<UserProfile[]> {
    return apiClient.get("users").json<UserProfile[]>();
}
