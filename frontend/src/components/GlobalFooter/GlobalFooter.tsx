import { ReactElement } from "react";
import styles from "./GlobalFooter.module.css";

export function GlobalFooter(): ReactElement {
    return (
        <div className={styles.footerContent}>
            <div className="mx-auto max-w-7xl w-full px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        © 2026 WSS Squardo – Plataforma de Avaliação de Maturidade de Segurança
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                        v1.0.0 Prototype
                    </div>
                </div>
            </div>
        </div>
    );
}