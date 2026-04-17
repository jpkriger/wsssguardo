import { ReactElement } from "react";
import { CriticalWindowCard } from "@/components/CriticalWindowCard/CriticalWindowCard";
import { ProjectsTable } from "@/components/ProjectsTable/ProjectsTable";
import type { Project } from "@/components/ProjectsTable/ProjectsTable";
import type { CriticalWindowItem } from "@/components/CriticalWindowCard/CriticalWindowCard";

// Mock

const MOCK_CRITICAL_WINDOWS: CriticalWindowItem[] = [
    { id: 1, label: "Entregas < 7 dias", count: 4, description: "Janela Crítica da semana" },
    { id: 2, label: "Entregas < 7 dias", count: 4, description: "Janela Crítica da semana" },
    { id: 3, label: "Entregas < 7 dias", count: 4, description: "Janela Crítica da semana" },
    { id: 4, label: "Entregas < 7 dias", count: 4, description: "Janela Crítica da semana" },
];

const MOCK_PROJECTS: Project[] = [
    {
        id: "33333333-3333-3333-3333-000000000001", name: "Avaliação de Maturidade - Alpha", code: "PRJ-001",
        daysRemaining: 15, totalDays: 30,
        consultant: { name: "Avaliador Um" },
        risks: [{ level: "alto", count: 5 }, { level: "medio", count: 3 }, { level: "baixo", count: 1 }],
    },
    {
        id: "33333333-3333-3333-3333-000000000002", name: "Análise de Gaps - Beta", code: "PRJ-002",
        daysRemaining: 8, totalDays: 45,
        consultant: { name: "Avaliador Um" },
        risks: [{ level: "alto", count: 2 }, { level: "medio", count: 5 }],
    },
    {
        id: "33333333-3333-3333-3333-000000000003", name: "Assessment de Segurança - Gamma", code: "PRJ-003",
        daysRemaining: 20, totalDays: 60,
        consultant: { name: "Avaliador Dois" },
        risks: [{ level: "medio", count: 4 }, { level: "baixo", count: 3 }],
    },
];

export default function ProjectsHome(): ReactElement {
    const criticalWindows = MOCK_CRITICAL_WINDOWS;
    const projects = MOCK_PROJECTS;

    return (
        <div className="flex flex-col gap-10">

            {/* Visão Geral */}
            <section className="mx-auto px-6 lg:px-24 max-w-[1280px] w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="!text-[32px] !font-bold text-foreground">Visão Geral</h1>
                    <p className="!text-[14px] text-muted-foreground">
                        Acompanhe o processo das auditorias de maturidade em tempo real.
                    </p>
                </div>

                {criticalWindows.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-6">
                        {criticalWindows.map((item) => (
                            <CriticalWindowCard
                                key={item.id}
                                label={item.label}
                                count={item.count}
                                description={item.description}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Tabela de Projetos */}
            <div className="mx-auto px-6 lg:px-24 max-w-[1280px] w-full">
                <ProjectsTable projects={projects} totalCount={projects.length} />
            </div>

        </div>
    );
}