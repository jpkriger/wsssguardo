import { useState, useMemo, type ReactElement } from "react";
import { GenericTable, type ColumnDefinition } from "@/components/GenericTable";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

// Demo data types
interface DemoItem {
  id: string;
  name: string;
  description: string;
  severity: "Alta" | "Média" | "Baixa";
  probability: number;
  impact: number;
  status: "Ativo" | "Resolvido" | "Pendente";
  createdAt: string;
  responsible: string;
}

// Mock data
const MOCK_DATA: DemoItem[] = [
  {
    id: "1",
    name: "Vulnerabilidade SQL Injection",
    description: "Risco de injeção SQL em formulários de login",
    severity: "Alta",
    probability: 85,
    impact: 90,
    status: "Ativo",
    createdAt: "2026-05-20",
    responsible: "Arthur Silva",
  },
  {
    id: "2",
    name: "Falta de Validação CSRF",
    description: "Token CSRF não implementado em formulários sensíveis",
    severity: "Alta",
    probability: 70,
    impact: 75,
    status: "Pendente",
    createdAt: "2026-05-19",
    responsible: "Maria Santos",
  },
  {
    id: "3",
    name: "Senhas Fracas Permitidas",
    description: "Sistema permite senhas com menos de 8 caracteres",
    severity: "Média",
    probability: 60,
    impact: 65,
    status: "Ativo",
    createdAt: "2026-05-18",
    responsible: "João Costa",
  },
  {
    id: "4",
    name: "XSS em Comentários",
    description: "Scripts maliciosos podem ser executados via comentários",
    severity: "Alta",
    probability: 55,
    impact: 70,
    status: "Resolvido",
    createdAt: "2026-05-17",
    responsible: "Ana Souza",
  },
  {
    id: "5",
    name: "Ausência de Rate Limiting",
    description: "API sem limite de requisições por usuário",
    severity: "Média",
    probability: 80,
    impact: 55,
    status: "Ativo",
    createdAt: "2026-05-16",
    responsible: "Pedro Oliveira",
  },
  {
    id: "6",
    name: "Logs sem Criptografia",
    description: "Arquivos de log armazenam dados sensíveis em texto plano",
    severity: "Média",
    probability: 45,
    impact: 60,
    status: "Pendente",
    createdAt: "2026-05-15",
    responsible: "Carlos Mendes",
  },
  {
    id: "7",
    name: "CORS Muito Permissivo",
    description: "CORS configurado para aceitar requisições de qualquer origem",
    severity: "Baixa",
    probability: 50,
    impact: 40,
    status: "Ativo",
    createdAt: "2026-05-14",
    responsible: "Beatriz Lima",
  },
  {
    id: "8",
    name: "Dependências Desatualizadas",
    description: "Bibliotecas com vulnerabilidades conhecidas não atualizadas",
    severity: "Alta",
    probability: 90,
    impact: 85,
    status: "Ativo",
    createdAt: "2026-05-13",
    responsible: "Roberto Ferreira",
  },
  {
    id: "9",
    name: "Falta de Autenticação 2FA",
    description: "Autenticação de dois fatores não implementada",
    severity: "Média",
    probability: 65,
    impact: 70,
    status: "Pendente",
    createdAt: "2026-05-12",
    responsible: "Fernanda Costa",
  },
  {
    id: "10",
    name: "Backup Sem Testes",
    description: "Sistema de backup não é testado regularmente",
    severity: "Baixa",
    probability: 40,
    impact: 95,
    status: "Resolvido",
    createdAt: "2026-05-11",
    responsible: "Lucas Barbosa",
  },
];

// Utility functions
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "Alta":
      return "bg-red-600 text-white";
    case "Média":
      return "bg-yellow-500 text-white";
    case "Baixa":
      return "bg-green-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Ativo":
      return "bg-blue-600 text-white";
    case "Resolvido":
      return "bg-green-600 text-white";
    case "Pendente":
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function truncateText(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

export default function GenericTableDemo(): ReactElement {
  const [items, setItems] = useState<DemoItem[]>(MOCK_DATA);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const PAGE_SIZE = 5;

  // Filtered data
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Paginated data
  const paginatedItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);

  // Column definitions
  const columns: ColumnDefinition<DemoItem>[] = [
    {
      id: "name",
      label: "Nome",
      dataType: "text",
      isRequired: true,
      renderCell: (item) => truncateText(item.name, 25),
      getSortValue: (item) => item.name,
      cellClassName: "px-5 py-2.5 text-sm text-foreground font-medium",
    },
    {
      id: "description",
      label: "Descrição",
      dataType: "text",
      renderCell: (item) => truncateText(item.description, 30),
      getSortValue: (item) => item.description,
      cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    },
    {
      id: "severity",
      label: "Severidade",
      dataType: "enum",
      renderCell: (item) => (
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(item.severity)}`}>
          {item.severity}
        </span>
      ),
      getSortValue: (item) =>
        item.severity === "Alta" ? 3 : item.severity === "Média" ? 2 : 1,
      cellClassName: "px-5 py-2.5",
    },
    {
      id: "probability",
      label: "Probabilidade",
      dataType: "number",
      renderCell: (item) => `${item.probability}%`,
      getSortValue: (item) => item.probability,
      cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
      headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground cursor-pointer hover:bg-accent",
    },
    {
      id: "impact",
      label: "Impacto",
      dataType: "number",
      renderCell: (item) => `${item.impact}%`,
      getSortValue: (item) => item.impact,
      cellClassName: "px-5 py-2.5 text-sm text-center text-foreground",
      headClassName: "px-5 py-3 text-center text-lg font-normal text-foreground cursor-pointer hover:bg-accent",
    },
    {
      id: "status",
      label: "Status",
      dataType: "enum",
      renderCell: (item) => (
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      ),
      getSortValue: (item) =>
        item.status === "Ativo" ? 3 : item.status === "Pendente" ? 2 : 1,
      cellClassName: "px-5 py-2.5",
    },
    {
      id: "responsible",
      label: "Responsável",
      dataType: "text",
      renderCell: (item) => truncateText(item.responsible, 18),
      getSortValue: (item) => item.responsible,
      cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    },
    {
      id: "createdAt",
      label: "Data",
      dataType: "date",
      renderCell: (item) => item.createdAt,
      getSortValue: (item) => new Date(item.createdAt),
      cellClassName: "px-5 py-2.5 text-sm text-muted-foreground",
    },
  ];

  const handleCreate = (): void => {
    toast.info("Ação de criar novo item");
  };

  const handleEdit = (item: DemoItem): void => {
    toast.info(`Editando: ${item.name}`);
  };

  const handleDelete = (item: DemoItem): void => {
    toast.success(`Deletado: ${item.name}`);
    setItems(items.filter((i) => i.id !== item.id));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 -ml-40">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          GenericTable Demo
        </h1>
        <p className="text-lg text-muted-foreground">
          Visualização do componente genérico de tabela reutilizável
        </p>
      </div>

      <GenericTable<DemoItem>
        tableId="demo-generic-table"
        data={paginatedItems}
        columns={columns}
        page={page}
        totalPages={totalPages}
        totalElements={filteredItems.length}
        pageSize={PAGE_SIZE}
        isLoading={false}
        error={null}
        onPageChange={setPage}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        title="Gestão de Riscos"
        subtitle="Riscos de segurança registrados no sistema"
        primaryAction={{
          label: "Novo Risco",
          icon: PlusIcon,
          onClick: handleCreate,
        }}
        rowActions={[
          {
            icon: PencilIcon,
            label: "Editar",
            onClick: handleEdit,
          },
          {
            icon: TrashIcon,
            label: "Deletar",
            variant: "destructive",
            onClick: handleDelete,
          },
        ]}
        enableSorting
        enableSearch
        enableColumnToggle
        emptyMessage="Nenhum risco encontrado"
        cardClassName="shadow-lg"
      />
    </div>
  );
}
