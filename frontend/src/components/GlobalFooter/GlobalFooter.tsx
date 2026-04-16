import type { ReactElement } from "react";

export default function GlobalFooter(): ReactElement {
    return (
        <div className="flex justify-between items-center px-50 [&>p]:opacity-50">
            <p>© 2026 WSS Sguardo — Plataforma de Avaliação de Maturidade de Segurança</p>
            <p>v1.0.0 Prototype</p>
        </div>
    );
}
