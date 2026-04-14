import { Link } from "react-router";

interface ProjectHomeClickableCardProps {
  icon?: React.ReactNode;
  title: string;
  data: string | number;
  link: string;
}

/*
Exemplo de Uso:
import { FolderOpen } from "lucide-react";

<ProjectHomeCard icon={<FolderOpen />} title="Ativos registrados" data="2" link="urldapagina"/>
*/

export default function ProjectHomeClickableCard({ icon, title, data, link }: ProjectHomeClickableCardProps) {
  return (
    <Link
      className="flex justify-between h-30 border rounded-2xl px-4 py-2.5 bg-white/50 dark:bg-foreground/5 w-full cursor-pointer transition-colors duration-300"
      to={link}
    >
      <div className="py-2 flex flex-col justify-between transition-colors duration-300">
        <h3 className="text-sm! text-muted-foreground!">{title}</h3>
        <h1>{data}</h1>
      </div>
      <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary [&_svg]:w-6 [&_svg]:h-6 [&_svg]:stroke-2 transition-colors duration-300">
        {icon}
      </div>
    </Link>
  );
}
