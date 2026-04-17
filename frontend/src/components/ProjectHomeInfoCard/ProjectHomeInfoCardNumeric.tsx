import type { ReactElement } from "react";
import ProjectHomeInfoCardFrame from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardFrame";

interface ProjectHomeInfoCardNumericProps {
  title: string;
  data: string | number;
  accent?: "red" | "yellow" | "green";
}

export default function ProjectHomeInfoCardNumeric({ title, data, accent = "red" }: ProjectHomeInfoCardNumericProps): ReactElement {
  return (
    <ProjectHomeInfoCardFrame accent={accent}>
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="text-sm! text-muted-foreground!">{title}</h3>
          <h1 className="mt-3 text-3xl font-semibold">{data}</h1>
        </div>
      </div>
    </ProjectHomeInfoCardFrame>
  );
}
