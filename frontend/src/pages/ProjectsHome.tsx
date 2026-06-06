import { ReactElement, useEffect, useMemo, useState } from "react";
import { CriticalWindowCard } from "@/components/CriticalWindowCard/CriticalWindowCard";
import { ProjectsTable } from "@/components/ProjectsTable/ProjectsTable";
import type { Project } from "@/components/ProjectsTable/ProjectsTable";
import type { CriticalWindowItem } from "@/components/CriticalWindowCard/CriticalWindowCard";
import { listProjects, type ProjectResponse } from "@/api/project";
import { getRiskSummary, type RiskSummaryResponse } from "@/api/risk";
import { listUsers, type UserProfile } from "@/api/users";
import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function summaryToRisks(summary: RiskSummaryResponse | null): Project["risks"] {
  if (!summary) return [];
  const entries: Project["risks"] = [];
  if (summary.highRisks > 0)   entries.push({ level: "alto",  count: summary.highRisks });
  if (summary.mediumRisks > 0) entries.push({ level: "medio", count: summary.mediumRisks });
  if (summary.lowRisks > 0)    entries.push({ level: "baixo", count: summary.lowRisks });
  return entries;
}

const FALLBACK_SCHEDULE_BY_STATUS: Record<
  string,
  { daysRemaining: number; totalDays: number }
> = {
  IN_PROGRESS: { daysRemaining: 15, totalDays: 30 },
  ON_HOLD: { daysRemaining: 8, totalDays: 45 },
  COMPLETED: { daysRemaining: 0, totalDays: 60 },
  CANCELLED: { daysRemaining: 0, totalDays: 30 },
};

function parseDateAsUtc(date: string | null): number | null {
  if (!date) return null;

  const parsed = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function utcToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function buildSchedule(project: ProjectResponse): {
  daysRemaining: number;
  totalDays: number;
} {
  const fallback = FALLBACK_SCHEDULE_BY_STATUS[project.status] ?? {
    daysRemaining: 15,
    totalDays: 30,
  };
  const startDateUtc = parseDateAsUtc(project.startDate);
  const endDateUtc = parseDateAsUtc(project.endDate);

  if (
    startDateUtc === null ||
    endDateUtc === null ||
    endDateUtc < startDateUtc
  ) {
    return fallback;
  }

  const totalDays = Math.floor((endDateUtc - startDateUtc) / MS_PER_DAY) + 1;
  const daysRemaining = Math.max(
    0,
    Math.floor((endDateUtc - utcToday()) / MS_PER_DAY) + 1,
  );

  return {
    daysRemaining,
    totalDays: Math.max(1, totalDays),
  };
}

function getUserDisplayName(user: UserProfile | undefined): string {
  if (!user) return "Consultor não encontrado";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.id;
}

function mapProjectToTable(
  project: ProjectResponse,
  index: number,
  summary: RiskSummaryResponse | null,
  usersById: Map<string, UserProfile>,
): Project {
  const schedule = buildSchedule(project);
  const consultants =
    project.consultantIds?.map((consultantId) => ({
      name: getUserDisplayName(usersById.get(consultantId)),
    })) ?? [];

  return {
    id: project.id,
    name: project.name,
    code: `PRJ-${String(index + 1).padStart(3, "0")}`,
    status: project.status,
    endDate: project.endDate,
    daysRemaining: Math.min(schedule.daysRemaining, schedule.totalDays),
    totalDays: schedule.totalDays,
    consultants,
    risks: summaryToRisks(summary),
  };
}

export default function ProjectsHome(): ReactElement {
  const [apiProjects, setApiProjects] = useState<ProjectResponse[]>([]);
  const [usersById, setUsersById] = useState<Map<string, UserProfile>>(new Map());
  const [riskSummaries, setRiskSummaries] = useState<Map<string, RiskSummaryResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [projects, users] = await Promise.all([
          listProjects(),
          listUsers().catch(() => []),
        ]);
        if (cancelled) return;
        setApiProjects(projects);
        setUsersById(new Map(users.map((user) => [user.id, user])));

        const summaries = await Promise.all(
          projects.map((p) => getRiskSummary(p.id).catch(() => null)),
        );
        if (cancelled) return;
        const summaryMap = new Map<string, RiskSummaryResponse>();
        projects.forEach((p, i) => {
          const s = summaries[i];
          if (s) summaryMap.set(p.id, s);
        });
        setRiskSummaries(summaryMap);
      } catch (err: unknown) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Erro ao carregar projetos";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const projects = useMemo(
    () =>
      apiProjects.map((project, index) =>
        mapProjectToTable(project, index, riskSummaries.get(project.id) ?? null, usersById),
      ),
    [apiProjects, riskSummaries, usersById],
  );

  const criticalWindows = useMemo<CriticalWindowItem[]>(() => {
    const dueSoon = projects.filter(
      (project) => project.daysRemaining > 0 && project.daysRemaining <= 7,
    ).length;
    const inProgress = apiProjects.filter(
      (project) => project.status === "IN_PROGRESS",
    ).length;
    const onHold = apiProjects.filter(
      (project) => project.status === "ON_HOLD",
    ).length;
    const completed = apiProjects.filter(
      (project) => project.status === "COMPLETED",
    ).length;

    return [
      {
        id: 1,
        label: "Entregas < 7 dias",
        count: dueSoon,
        description: "Janela Crítica da semana",
      },
      {
        id: 2,
        label: "Em andamento",
        count: inProgress,
        description: "Projetos ativos no momento",
      },
      {
        id: 3,
        label: "Em espera",
        count: onHold,
        description: "Projetos pausados",
      },
      {
        id: 4,
        label: "Concluídos",
        count: completed,
        description: "Projetos finalizados",
      },
    ];
  }, [apiProjects, projects]);

return (
  <>
    <Link
      to="/companies"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronLeft className="size-4" />
      Voltar para Empresas
    </Link>

    <div className="flex flex-col gap-10">
      {/* Visão Geral */}
      <section className="w-full">
        <div className="flex flex-col gap-2">
          <h1 className="!text-[32px] !font-bold text-foreground">
            Visão Geral
          </h1>
          <p className="!text-[14px] text-muted-foreground">
            Acompanhe o processo das auditorias de maturidade em tempo real.
          </p>
        </div>

        {loading && (
          <p className="mt-4 !text-[14px] text-muted-foreground">
            Carregando projetos...
          </p>
        )}

        {error && <p className="mt-4 !text-[14px] text-destructive">{error}</p>}

        {!loading && !error && criticalWindows.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-6 ">
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
      <div className="w-full">
        <ProjectsTable projects={projects} totalCount={projects.length} />
      </div>
    </div>
  </>
);
}
