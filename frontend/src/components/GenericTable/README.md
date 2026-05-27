# GenericTable - Componente de Tabela Reutilizável

## Visão Geral

O `GenericTable` é um componente reutilizável para padronizar todas as tabelas do projeto (Riscos, Ativos, Artefatos, Achados, Empresas, Projetos).

## Características

✅ **Colunas Configuráveis**: Defina colunas via props com tipos de dados  
✅ **Ordenação por Coluna**: Clique no header para ordenar (asc/desc/sem ordenação)  
✅ **Seletor de Colunas**: Estilo Excel com checkboxes, persistência no localStorage  
✅ **Filtro de Busca Global**: Campo de pesquisa integrado  
✅ **Paginação**: Controles navegáveis com página atual destacada  
✅ **Layout Amplo**: 95% da largura, altura otimizada  
✅ **Actions de Linha**: Suporte para botões (editar, excluir, etc.)  
✅ **Estados**: Loading, erro, vazio  
✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela

## Props

```typescript
interface GenericTableProps<T> {
  tableId: string;                    // ID único para localStorage
  data: T[];                          // Dados para exibir
  columns: ColumnDefinition<T>[];     // Definição das colunas
  page: number;                       // Página atual (0-indexed)
  totalPages: number;                 // Total de páginas
  totalElements: number;              // Total de registros
  pageSize: number;                   // Itens por página
  isLoading: boolean;                 // Estado de loading
  error?: string | null;              // Mensagem de erro
  onPageChange: (page: number) => void;  // Callback ao mudar página
  onColumnToggle?: (columnId: string) => void;  // Callback ao alternar coluna
  defaultColumnConfig?: { [columnId: string]: boolean };  // Colunas visíveis por padrão
  title?: string;                     // Título da tabela
  subtitle?: string;                  // Subtítulo
  primaryAction?: {                   // Botão de ação primária (criar novo)
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  rowActions?: {                      // Ações de linha (editar, deletar)
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: (item: T) => void;
    variant?: "default" | "destructive";
  }[];
  emptyMessage?: string;              // Mensagem quando vazio
  enableSorting?: boolean;            // Habilitar ordenação
  enableSearch?: boolean;             // Habilitar busca
  searchValue?: string;               // Valor da busca
  onSearchChange?: (value: string) => void;  // Callback ao mudar busca
  enableColumnToggle?: boolean;       // Habilitar toggle de colunas
}
```

## ColumnDefinition

```typescript
interface ColumnDefinition<T> {
  id: string;                         // ID único da coluna
  label: string;                      // Label do header
  dataType?: ColumnDataType;          // Tipo: "text" | "date" | "enum" | "number" | "custom"
  headClassName?: string;             // CSS classes do header
  cellClassName?: string;             // CSS classes das células
  renderCell: (item: T) => ReactElement | string;  // Função de renderização
  getSortValue?: (item: T) => string | number | Date | null;  // Função para ordenação
  isRequired?: boolean;               // Coluna sempre visível
  width?: string;                     // Largura da coluna
}
```

## Exemplo de Uso - Refatorando RiskTable

```typescript
import { GenericTable, type ColumnDefinition } from "@/components/GenericTable";
import { PencilIcon, TrashIcon } from "lucide-react";
import type { RiskResponse } from "@/api/risk";

export default function RiskTable(): ReactElement {
  const { projectId } = useProject();
  const [risks, setRisks] = useState<RiskResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskCategories, setRiskCategories] = useState<RiskCategoryDTO[]>([]);

  // ... fetch functions ...

  // Define columns
  const columns: ColumnDefinition<RiskResponse>[] = [
    {
      id: "name",
      label: "Nome",
      dataType: "text",
      isRequired: true,
      renderCell: (risk) => truncateText(risk.name, 28),
      getSortValue: (risk) => risk.name || "",
    },
    {
      id: "description",
      label: "Impacto ao Negócio",
      dataType: "text",
      renderCell: (risk) => truncateText(risk.description, 28),
      getSortValue: (risk) => risk.description || "",
    },
    {
      id: "occurrenceProbability",
      label: "Prob. Ocorrência",
      dataType: "number",
      renderCell: (risk) => formatProbability(risk.occurrenceProbability),
      getSortValue: (risk) => risk.occurrenceProbability ?? 0,
    },
    {
      id: "riskLevel",
      label: "Nível",
      dataType: "enum",
      renderCell: (risk) => {
        const levelConfig = getRiskLevelConfig(risk.riskLevel);
        return (
          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${levelConfig.className}`}>
            {levelConfig.label}
          </span>
        );
      },
      getSortValue: (risk) => risk.riskLevel ?? 0,
    },
    // ... more columns
  ];

  const defaultColumnConfig: ColumnConfig = Object.fromEntries(
    columns.map((col, idx) => [col.id, idx < 6])
  );

  return (
    <GenericTable<RiskResponse>
      tableId="risk-table"
      data={risks}
      columns={columns}
      page={page}
      totalPages={totalPages}
      totalElements={totalElements}
      pageSize={PAGE_SIZE}
      isLoading={loading}
      error={error}
      onPageChange={(newPage) => loadRisks(newPage)}
      defaultColumnConfig={defaultColumnConfig}
      title="Riscos"
      subtitle="Riscos registrados e vinculados ao escopo"
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
          onClick: (risk) => {
            setRiskToDelete(risk);
            setConfirmDeleteOpen(true);
          },
        },
      ]}
      enableSorting
      enableSearch
      enableColumnToggle
    />
  );
}
```

## Exemplo de Uso - Com Busca e Filtros Customizados

```typescript
// Para adicionar filtros mais avançados (por criador, data, etc),
// implemente a lógica de filtro antes de passar os dados para o GenericTable

const filteredRisks = useMemo(() => {
  let filtered = risks;

  // Filtro por criador
  if (selectedCreator) {
    filtered = filtered.filter(r => r.createdBy === selectedCreator);
  }

  // Filtro por intervalo de datas
  if (dateRange.start && dateRange.end) {
    filtered = filtered.filter(r => {
      const riskDate = new Date(r.createdAt);
      return riskDate >= dateRange.start && riskDate <= dateRange.end;
    });
  }

  return filtered;
}, [risks, selectedCreator, dateRange]);

return (
  <GenericTable<RiskResponse>
    tableId="risk-table"
    data={filteredRisks}
    // ... outros props
  />
);
```

## Estilos

O componente utiliza Tailwind CSS + componentes shadcn/ui. Estilos customizados no `GenericTable.css`:

- Largura: 95% com max-width 1400px
- Altura mínima: 600px
- Altura das linhas: 45px
- Responsivo em telas menores

## Migração de Tabelas Existentes

Para migrar uma tabela existente:

1. **Mova a lógica de dados** para o componente pai (fetch, estado)
2. **Defina as colunas** no novo formato `ColumnDefinition[]`
3. **Substitua o JSX** pela chamada `<GenericTable />`
4. **Implemente handlers** para primaryAction e rowActions

### Exemplo Antes → Depois

**Antes** (~300+ linhas de JSX, lógica duplicada):
```tsx
// RiskTable.tsx com todo o JSX inline
```

**Depois** (~100 linhas, limpo e reutilizável):
```tsx
return (
  <GenericTable<RiskResponse>
    tableId="risk-table"
    data={risks}
    columns={columns}
    // ... props
  />
);
```

## Próximas Tabelas para Refatorar

1. ✅ `GenericTable` - Criado
2. ⏳ `RiskTable` - Use como modelo
3. ⏳ `AssetTable` - Similar a RiskTable
4. ⏳ `CompaniesTable`
5. ⏳ `ProjectsTable`
6. ⏳ `ArtifactList` → Refatorar para tabela
7. ⏳ `FindingList` → Refatorar para tabela

## Notas Importantes

- **Colunas Obrigatórias**: Use `isRequired: true` para colunas que não podem ser ocultadas
- **Ordenação**: Implemente `getSortValue()` para cada coluna ordenável
- **Busca**: A busca é apenas na UI; implemente lógica de filtro no componente pai se precisar
- **localStorage**: Colunas visíveis são salvas com a chave `table-columns-{tableId}`
- **Performance**: Use `useMemo` para dados filtrados/processados
