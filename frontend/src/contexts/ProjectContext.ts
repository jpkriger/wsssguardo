import { createContext, useContext } from "react";

export interface ProjectContextValue {
    projectId: string;
}

export const MOCK_PROJECT_ID = "33333333-3333-3333-3333-000000000001";

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject(): ProjectContextValue {
    const ctx = useContext(ProjectContext);
    if (!ctx) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return ctx;
}
