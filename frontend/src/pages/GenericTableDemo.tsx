import { useState, useMemo, type ReactElement } from "react";
import GenericTable from "../components/GenericTable/GenericTable";
import type { ColumnDefinition } from "../components/GenericTable/types";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { ChevronLeft } from "lucide-react";

// --- Mock data types ---

interface MockProject {
  id: string;
  name: string;
  code: string;
  status: "Em andamento" | "Concluído" | "Em espera";
  consultant: string;
  daysRemaining: number;
  riskLevel: string;
}

// --- Mock data ---

const MOCK_PROJECTS: MockProject[] = [
  {
    id: "1",
    name: "Auditoria Financeira",
    code: "AUD-2024-001",
    status: "Em andamento",
    consultant: "Carlos Silva",
    daysRemaining: 45,
    riskLevel: "Alto",
  },
  {
    id: "2",
    name: "Segurança da Informação",
    code: "SEC-2024-002",
    status: "Concluído",
    consultant: "Ana Oliveira",
    daysRemaining: 0,
    riskLevel: "Médio",
  },
  {
    id: "3",
    name: "Conformidade LGPD",
    code: "LGP-2024-003",
    status: "Em andamento",
    consultant: "Pedro Santos",
    daysRemaining: 90,
    riskLevel: "Baixo",
  },
  {
    id: "4",
    name: "Auditoria Operacional",
    code: "AUD-2024-004",
    status: "Em espera",
    consultant: "Maria Costa",
    daysRemaining: 120,
    riskLevel: "Médio",
  },
  {
    id: "5",
    name: "Riscos Ambientais",
    code: "RIS-2024-005",
    status: "Em andamento",
    consultant: "Carlos Silva",
    daysRemaining: 30,
    riskLevel: "Alto",
  },
  {
    id: "6",
    name: "Auditoria de TI",
    code: "AUD-2024-006",
    status: "Em andamento",
    consultant: "Ana Oliveira",
    daysRemaining: 60,
    riskLevel: "Médio",
  },
  {
    id: "7",
    name: "Conformidade Tributária",
    code: "TAX-2024-007",
    status: "Concluído",
    consultant: "Pedro Santos",
    daysRemaining: 0,
    riskLevel: "Baixo",
  },
  {
    id: "8",
    name: "Auditoria de Processos",
    code: "AUD-2024-008",
    status: "Em andamento",
    consultant: "Maria Costa",
    daysRemaining: 15,
    riskLevel: "Baixo",
  },
  {
    id: "9",
    name: "Segurança Patrimonial",
    code: "SEC-2024-009",
    status: "Em espera",
    consultant: "Carlos Silva",
    daysRemaining: 180,
    riskLevel: "Alto",
  },
  {
    id: "10",
    name: "Auditoria Contábil",
    code: "AUD-2024-010",
    status: "Em andamento",
    consultant: "Ana Oliveira",
    daysRemaining: 75,
    riskLevel: "Médio",
  },
  {
    id: "11",
    name: "Riscos de Mercado",
    code: "RIS-2024-011",
    status: "Em andamento",
    consultant: "Pedro Santos",
    daysRemaining: 45,
    riskLevel: "Alto",
  },
  {
    id: "12",
    name: "Conformidade Ambiental",
    code: "ENV-2024-012",
    status: "Concluído",
    consultant: "Maria Costa",
    daysRemaining: 0,
    riskLevel: "Médio",
  },
];

const PAGE_SIZE = 5;

function SeverityBadge({ level }: { level: string }): ReactElement {
  const colors: Record<string, string> = {
    Alto: "bg-red-600 text-white",
    Médio: "bg-yellow-500 text-white",
    Baixo: "bg-green-600 text-white",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${colors[level] || ""}`}
    >
      {level}
    </span>
  );
}

export default function GenericTableDemo(): ReactElement {
  const [page, setPage] = useState(0);

  const columns: ColumnDefinition<MockProject>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Projeto",
        getSortValue: (p) => p.name,
        isRequired: true,
        width: "22%",
        renderCell: (p) => (
          <div>
            <p className="font-semibold text-base">{p.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.code}</p>
          </div>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "14%",
        renderCell: (p) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              p.status === "Concluído"
                ? "bg-emerald-500/15 text-emerald-600"
                : p.status === "Em espera"
                  ? "bg-yellow-500/15 text-yellow-600"
                  : "bg-blue-500/15 text-blue-600"
            }`}
          >
            {p.status}
          </span>
        ),
      },
      {
        id: "consultant",
        label: "Consultor",
        getSortValue: (p) => p.consultant,
        width: "16%",
        renderCell: (p) => p.consultant,
      },
      {
        id: "daysRemaining",
        label: "Dias Restantes",
        getSortValue: (p) => p.daysRemaining,
        width: "14%",
        renderCell: (p) => (
          <span
            className={p.daysRemaining === 0 ? "text-muted-foreground" : ""}
          >
            {p.daysRemaining === 0
              ? "Prazo encerrado"
              : `${p.daysRemaining} dias`}
          </span>
        ),
      },
      {
        id: "riskLevel",
        label: "Nível de Risco",
        width: "16%",
        renderCell: (p) => <SeverityBadge level={p.riskLevel} />,
      },
    ],
    [],
  );

  const totalPages = Math.ceil(MOCK_PROJECTS.length / PAGE_SIZE);
  const pagedData = useMemo(
    () => MOCK_PROJECTS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [page],
  );

  return (
    <section className="w-full max-w-7xl mx-auto py-8 px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        GenericTable Demo
      </h1>
      <p className="text-muted-foreground mb-8">
        Demonstração do componente{" "}
        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
          GenericTable
        </code>{" "}
        com dados mockados. Funcionalidades: ordenação por coluna, busca
        textual, toggle de colunas, paginação, estados de loading/error/empty, e
        ações por linha.
      </p>

      <div className="flex flex-col gap-8">
        {/* Example 1: Normal table */}
        <GenericTable
          tableId="demo-projects"
          data={pagedData}
          columns={columns}
          page={page}
          totalPages={totalPages}
          totalElements={MOCK_PROJECTS.length}
          pageSize={PAGE_SIZE}
          isLoading={false}
          onPageChange={setPage}
          title="Projetos de Auditoria"
          subtitle="Lista de projetos mockados para demonstração"
          primaryAction={{
            label: "Novo Projeto",
            onClick: () => alert("Ação primária!"),
          }}
          rowActions={[
            {
              icon: Pencil,
              label: "Editar",
              onClick: (item) => alert(`Editar: ${item.name}`),
            },
            {
              icon: Trash2,
              label: "Excluir",
              onClick: (item) => alert(`Excluir: ${item.name}`),
              variant: "destructive",
            },
          ]}
          enableSorting
          enableSearch
          enableColumnToggle
        />

        {/* Example 2: With expandable content */}
        <GenericTable
          tableId="demo-projects-expandable"
          data={pagedData}
          columns={columns}
          page={page}
          totalPages={totalPages}
          totalElements={MOCK_PROJECTS.length}
          pageSize={PAGE_SIZE}
          isLoading={false}
          onPageChange={setPage}
          title="Com Expandable Rows"
          subtitle="Clique em uma linha para ver detalhes expandidos"
          enableSorting
          enableSearch
          expandableContent={(item) => (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Código
                  </p>
                  <p className="text-sm font-medium">{item.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Consultor
                  </p>
                  <p className="text-sm font-medium">{item.consultant}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-sm font-medium">{item.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Risco
                  </p>
                  <span>
                    <SeverityBadge level={item.riskLevel} />
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="px-3 py-1.5 text-sm rounded border border-border text-foreground hover:border-primary transition-colors bg-transparent cursor-pointer"
                  onClick={() => alert(`Editar: ${item.name}`)}
                >
                  Editar
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded border border-border text-destructive hover:border-destructive transition-colors bg-transparent cursor-pointer"
                  onClick={() => alert(`Excluir: ${item.name}`)}
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        />

        {/* Example 3: Loading state */}
        <GenericTable
          tableId="demo-loading"
          data={[]}
          columns={columns}
          page={0}
          totalPages={0}
          totalElements={0}
          pageSize={PAGE_SIZE}
          isLoading={true}
          onPageChange={() => {}}
          title="Estado de Loading"
          subtitle="Exemplo de como o componente se comporta enquanto carrega"
        />

        {/* Example 4: Empty state */}
        <GenericTable
          tableId="demo-empty"
          data={[]}
          columns={columns}
          page={0}
          totalPages={0}
          totalElements={0}
          pageSize={PAGE_SIZE}
          isLoading={false}
          onPageChange={() => {}}
          title="Estado Vazio"
          subtitle="Exemplo de quando não há dados"
        />

        {/* Example 5: Error state */}
        <GenericTable
          tableId="demo-error"
          data={[]}
          columns={columns}
          page={0}
          totalPages={0}
          totalElements={0}
          pageSize={PAGE_SIZE}
          isLoading={false}
          error="Falha ao carregar os dados. Tente novamente mais tarde."
          onPageChange={() => {}}
          title="Estado de Erro"
          subtitle="Exemplo de quando ocorre um erro"
        />
      </div>
    </section>
  );
}
