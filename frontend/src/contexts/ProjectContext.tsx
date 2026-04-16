import { createContext, useContext, type ReactElement, type ReactNode } from "react";

interface ProjectContextValue {
    projectId: string;
}

const MOCK_PROJECT_ID = "33333333-3333-3333-3333-000000000001";

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }): ReactElement {
    return (
        <ProjectContext.Provider value={{ projectId: MOCK_PROJECT_ID }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject(): ProjectContextValue {
    const ctx = useContext(ProjectContext);
    if (!ctx) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return ctx;
}
