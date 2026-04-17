import type { ReactNode, ReactElement } from "react";

interface ProjectHomeInfoCardFrameProps {
  accent: "red" | "yellow" | "green" | "blue";
  children: ReactNode;
}

const accentClasses: Record<ProjectHomeInfoCardFrameProps["accent"], string> = {
  red: "bg-red-500/80",
  yellow: "bg-amber-500/80",
  green: "bg-lime-500/80",
  blue: "bg-sky-500/80",
};

export default function ProjectHomeInfoCardFrame({ accent, children }: ProjectHomeInfoCardFrameProps): ReactElement {
  return (
    <div className={`rounded-2xl min-h-28 w-full ${accentClasses[accent]} transition-colors duration-300`}>
      <div className="w-full h-full bg-background rounded-2xl overflow-hidden translate-x-2 border-l-0 border transition-colors duration-300">
        <div className="bg-white/50 dark:bg-foreground/5 h-full w-full px-5 py-5 transition-colors duration-300">{children}</div>
      </div>
    </div>
  );
}
