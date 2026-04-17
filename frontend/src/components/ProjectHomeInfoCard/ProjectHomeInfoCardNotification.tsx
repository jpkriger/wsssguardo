import type { ReactNode, ReactElement } from "react";
import ProjectHomeInfoCardFrame from "@/components/ProjectHomeInfoCard/ProjectHomeInfoCardFrame";

interface ProjectHomeInfoCardNotificationProps {
  icon?: ReactNode;
  title: string;
  description: string;
  accent?: "red" | "yellow" | "green";
}

export default function ProjectHomeInfoCardNotification({ icon, title, description, accent = "red" }: ProjectHomeInfoCardNotificationProps): ReactElement {
  return (
    <ProjectHomeInfoCardFrame accent={accent}>
      <div className="flex flex-col justify-between gap-4 h-full">
        <div className={`flex gap-2.5 [&_svg]:text-${accent}`}>
          {icon}
          <h3 className="text-sm! text-muted-foreground!">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </ProjectHomeInfoCardFrame>
  );
}
