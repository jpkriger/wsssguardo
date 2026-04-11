import AssetTable from "@/components/AssetTable/AssetTable";
import { ReactElement } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home(): ReactElement {
  return (
    <div>
      {/* PAGINA PLACEHOLDER PARA TESTAR COMPONENTES, MODIFIQUE DENTRO DESTA DIV A VONTADE */}
      <h1>Home</h1>
      <p className="text-muted-foreground mb-7">Página inicial do WSS Sguardo.</p>
      <AssetTable/>
      <nav>
        <ThemeToggle />
      </nav>
    </div>
  );
}
