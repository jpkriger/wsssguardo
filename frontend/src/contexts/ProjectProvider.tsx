import type { ReactElement, ReactNode } from "react";
import { MOCK_PROJECT_ID, ProjectContext } from "./ProjectContext";

interface ProjectProviderProps {
  children: ReactNode;
  projectId?: string;
}

export function ProjectProvider({
  children,
  projectId,
}: ProjectProviderProps): ReactElement {
  return (
    <ProjectContext.Provider
      value={{
        projectId: projectId ?? MOCK_PROJECT_ID,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
