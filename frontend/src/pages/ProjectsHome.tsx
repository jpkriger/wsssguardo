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
        id: "1", name: "Projeto Alfa", code: "PRJ-001",
        daysRemaining: 15, totalDays: 30,
        consultant: { name: "Daniel Moura" },
        risks: [{ level: "alto", count: 5 }, { level: "medio", count: 3 }, { level: "baixo", count: 1 }],
    },
    {
        id: "2", name: "Projeto Beta", code: "PRJ-002",
        daysRemaining: 8, totalDays: 45,
        consultant: { name: "Ana Costa" },
        risks: [{ level: "alto", count: 2 }, { level: "medio", count: 5 }],
    },
    {
        id: "3", name: "Projeto Gama", code: "PRJ-003",
        daysRemaining: 20, totalDays: 60,
        consultant: { name: "Daniel Moura" },
        risks: [{ level: "medio", count: 4 }, { level: "baixo", count: 3 }],
    },
    {
        id: "4", name: "Projeto Delta", code: "PRJ-004",
        daysRemaining: 3, totalDays: 30,
        consultant: { name: "Ana Costa" },
        risks: [{ level: "alto", count: 7 }, { level: "medio", count: 2 }, { level: "baixo", count: 1 }],
    },
    {
        id: "5", name: "Projeto Épsilon", code: "PRJ-005",
        daysRemaining: 12, totalDays: 30,
        consultant: { name: "Daniel Moura" },
        risks: [{ level: "alto", count: 1 }, { level: "baixo", count: 6 }],
    },
    {
        id: "6", name: "Projeto Zeta", code: "PRJ-006",
        daysRemaining: 25, totalDays: 90,
        consultant: { name: "Ana Costa" },
        risks: [{ level: "medio", count: 3 }, { level: "baixo", count: 2 }],
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