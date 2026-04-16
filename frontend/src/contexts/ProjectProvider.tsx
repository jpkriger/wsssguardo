import type { ReactElement, ReactNode } from "react";
import { MOCK_PROJECT_ID, ProjectContext } from "./ProjectContext";

export function ProjectProvider({ children }: { children: ReactNode }): ReactElement {
    return (
        <ProjectContext.Provider value={{ projectId: MOCK_PROJECT_ID }}>
            {children}
        </ProjectContext.Provider>
    );
}
