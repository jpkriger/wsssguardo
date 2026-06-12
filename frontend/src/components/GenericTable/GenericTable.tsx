import {
  ReactElement,
  useState,
  useMemo,
  useCallback,
  useEffect,
  Fragment,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Settings,
} from "lucide-react";
import type { GenericTableProps, TableState } from "./types";
import {
  applyFilters,
  applySearch,
  clampPage,
  getFilterOptions,
  resolveRowId as resolveRowIdFn,
  sortRows,
  totalClientPages,
} from "./tableLogic";

/**
 * GenericTable - Reusable table component with sorting, pagination, search, and column visibility
 */
export default function GenericTable<T>({
  tableId,
  data,
  columns,
  clientPagination = false,
  clientSearch = false,
  page = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  isLoading = false,
  error = null,
  onPageChange,
  onColumnToggle,
  defaultColumnConfig = {},
  title,
  subtitle,
  primaryAction,
  rowActions = [],
  emptyMessage = "Nenhum dado encontrado",
  enableSorting = true,
  enableSearch = true,
  searchValue = "",
  onSearchChange,
  enableColumnToggle = true,
  className = "",
  cardClassName = "",
  expandableContent,
  headerExtra,
  onRowClick,
  getRowId,
  filters = [],
}: GenericTableProps<T>): ReactElement {
  // Resolve a stable id per row (item.id when present, else the index).
  // Keeps expansion state and React keys tied to the item, not its position,
  // so paging/sorting never leaks expansion or component state across rows.
  const resolveRowId = useCallback(
    (item: T, index: number): string => resolveRowIdFn(item, index, getRowId),
    [getRowId],
  );
  // State
  const [tableState, setTableState] = useState<TableState>({
    sortColumn: null,
    sortDirection: null,
    searchQuery: searchValue,
  });

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    // Load from localStorage or use defaults
    try {
      const saved = localStorage.getItem(`table-columns-${tableId}`);
      if (saved) {
        return JSON.parse(saved) as Record<string, boolean>;
      }
    } catch {
      console.warn(`Failed to load column visibility for table ${tableId}`);
    }

    // Use default config
    return columns.reduce(
      (acc, col) => ({
        ...acc,
        [col.id]: defaultColumnConfig[col.id] !== false && !col.isRequired,
      }),
      {},
    );
  });

  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clientPage, setClientPage] = useState(0);

  // Header filter state (select value per filter id; date range per filter id)
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>(
    {},
  );
  const [dateFilters, setDateFilters] = useState<
    Record<string, { from?: string; to?: string }>
  >({});

  // Sync search value from props
  useEffect(() => {
    setTableState((prev) => ({
      ...prev,
      searchQuery: searchValue,
    }));
  }, [searchValue]);

  // Reset to the first page when the search query or active filters change
  useEffect(() => {
    if (clientPagination) setClientPage(0);
  }, [tableState.searchQuery, selectFilters, dateFilters, clientPagination]);

  // Handle column visibility toggle
  const handleColumnToggle = useCallback(
    (columnId: string) => {
      setColumnVisibility((prev) => {
        const newVisibility = {
          ...prev,
          [columnId]: !prev[columnId],
        };
        // Save to localStorage
        try {
          localStorage.setItem(
            `table-columns-${tableId}`,
            JSON.stringify(newVisibility),
          );
        } catch {
          console.warn(`Failed to save column visibility for table ${tableId}`);
        }
        onColumnToggle?.(columnId, newVisibility);
        return newVisibility;
      });
    },
    [tableId, onColumnToggle],
  );

  // Handle sort
  const handleSort = useCallback(
    (columnId: string) => {
      if (!enableSorting) return;

      setTableState((prev) => {
        if (prev.sortColumn === columnId) {
          // Cycle: asc -> desc -> null
          const nextDirection =
            prev.sortDirection === "asc"
              ? "desc"
              : prev.sortDirection === "desc"
                ? null
                : "asc";
          return {
            ...prev,
            sortDirection: nextDirection,
          };
        } else {
          // New column, start with asc
          return {
            ...prev,
            sortColumn: columnId,
            sortDirection: "asc",
          };
        }
      });
    },
    [enableSorting],
  );

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setTableState((prev) => ({
        ...prev,
        searchQuery: value,
      }));
      onSearchChange?.(value);
    },
    [onSearchChange],
  );

  // Visible columns
  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (col) => col.isRequired || columnVisibility[col.id] !== false,
      ),
    [columns, columnVisibility],
  );

  // Distinct option lists for select filters, derived from the data
  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of filters) {
      if (f.type !== "select") continue;
      map[f.id] = getFilterOptions(data, f);
    }
    return map;
  }, [filters, data]);

  // Apply header filters, then the client-side text search
  const filteredData = useMemo(() => {
    const afterFilters = applyFilters(
      data,
      filters,
      selectFilters,
      dateFilters,
    );
    return clientSearch
      ? applySearch(afterFilters, columns, tableState.searchQuery)
      : afterFilters;
  }, [
    data,
    columns,
    filters,
    selectFilters,
    dateFilters,
    clientSearch,
    tableState.searchQuery,
  ]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!enableSorting || !tableState.sortColumn || !tableState.sortDirection) {
      return filteredData;
    }
    const column = columns.find((col) => col.id === tableState.sortColumn);
    return sortRows(filteredData, column, tableState.sortDirection);
  }, [
    filteredData,
    columns,
    enableSorting,
    tableState.sortColumn,
    tableState.sortDirection,
  ]);

  // Client-side pagination slice
  const displayData = useMemo(() => {
    if (!clientPagination) return sortedData;
    const start = clientPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, clientPagination, clientPage, pageSize]);

  // Effective pagination values (internal when client-side, props when server-side)
  const effectivePage = clientPagination ? clientPage : page;
  const effectiveTotalPages = clientPagination
    ? totalClientPages(sortedData.length, pageSize)
    : totalPages;
  const effectiveTotalElements = clientPagination ? sortedData.length : totalElements;
  const handlePageChange = clientPagination
    ? setClientPage
    : (onPageChange ?? (() => {}));

  // Keep the current client page within range when the result set shrinks
  // (e.g. after a filter narrows results or a row is deleted).
  useEffect(() => {
    if (!clientPagination) return;
    const clamped = clampPage(clientPage, effectiveTotalPages);
    if (clamped !== clientPage) setClientPage(clamped);
  }, [clientPagination, clientPage, effectiveTotalPages]);

  // Shared column count for colSpan across header/body/empty/loading states
  const columnCount =
    visibleColumns.length +
    (rowActions.length > 0 ? 1 : 0) +
    (expandableContent ? 1 : 0);

  // Render sort indicator
  const renderSortIndicator = (columnId: string): string | null => {
    if (!enableSorting || tableState.sortColumn !== columnId) return null;
    return (tableState.sortDirection === "asc" ? "↑" : "↓") as string;
  };

  // Render header
  const renderTableHeader = (): ReactElement => {
    const hasExpandable = !!expandableContent;
    return (
      <thead className="bg-muted">
        <tr>
          {hasExpandable && (
            <th className="w-10 px-2 py-5" aria-label="Expandir" />
          )}
          {visibleColumns.map((col) => {
            const indicator = renderSortIndicator(col.id);
            return (
              <th
                key={col.id}
                className={`px-2 py-5 text-left text-sm font-semibold text-foreground ${
                  col.headClassName || ""
                } ${enableSorting && !col.isRequired ? "cursor-pointer hover:bg-muted/80" : ""}`}
                style={{ width: col.width }}
                onClick={() => handleSort(col.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{col.label}</span>
                  {indicator && (
                    <span className="inline-flex items-center justify-center w-4.5 h-4.5 text-xs font-semibold opacity-60">
                      {indicator}
                    </span>
                  )}
                </div>
              </th>
            );
          })}
          {rowActions.length > 0 && (
            <th className="px-2 py-5 text-left text-sm font-semibold">Ações</th>
          )}
        </tr>
      </thead>
    );
  };

  // Render row
  const renderTableRow = (item: T, index: number): ReactElement => {
    const id = resolveRowId(item, index);
    const isExpanded = expandedId === id;
    const hasExpandable = !!expandableContent;

    return (
      <Fragment key={id}>
        <tr
          className={`border-b transition-colors ${
            hasExpandable || onRowClick ? "cursor-pointer" : ""
          } ${isExpanded ? "bg-muted/30" : "hover:bg-muted/30"}`}
          onClick={() => {
            if (hasExpandable) {
              setExpandedId((prev) => (prev === id ? null : id));
            } else if (onRowClick) {
              onRowClick(item);
            }
          }}
        >
          {hasExpandable && (
            <td className="px-2 py-5 text-sm text-center w-10">
              <span className="text-muted-foreground text-sm leading-none">
                {isExpanded ? "▴" : "▾"}
              </span>
            </td>
          )}
          {visibleColumns.map((col) => (
            <td
              key={col.id}
              className={`px-2 py-5 text-sm text-foreground ${
                col.cellClassName || ""
              }`}
              style={{ width: col.width }}
            >
              {col.renderCell(item)}
            </td>
          ))}
          {rowActions.length > 0 && (
            <td className="px-2 py-5 text-sm">
              <div className="flex gap-2">
                {rowActions.map((action) => (
                  <button
                    key={action.label}
                    className={`opacity-80 hover:opacity-100 hover:bg-muted/5 transition-all p-1 rounded border-none bg-transparent cursor-pointer ${
                      action.variant === "destructive"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(item);
                    }}
                    title={action.label}
                  >
                    <action.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </td>
          )}
        </tr>
        {isExpanded && expandableContent && (
          <tr className="border-b bg-muted/10">
            <td
              colSpan={columnCount}
              className="px-8 py-4"
              data-allow-wrap="true"
            >
              {expandableContent(item, { close: () => setExpandedId(null) })}
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  // Render empty state
  const renderEmptyState = (): ReactElement => (
    <div className="flex flex-col items-center justify-center min-h-[calc(6*45px)] p-8 text-muted-foreground">
      <svg
        className="w-12 h-12 mb-4 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p>{emptyMessage}</p>
    </div>
  );

  // Render loading state
  const renderLoadingState = (): ReactElement => (
    <div className="flex items-center justify-center min-h-[calc(6*45px)]">
      <div className="w-8 h-8 animate-spin">
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.3" />
          <circle
            cx="12"
            cy="12"
            r="10"
            strokeWidth="2"
            strokeDasharray="15.7 47.1"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );

  // Render error state
  const renderErrorState = (): ReactElement => (
    <div className="p-4 bg-destructive/10 text-destructive rounded-md">
      <p className="font-semibold">Erro</p>
      <p className="text-sm">{error}</p>
    </div>
  );

  // Render table body
  const renderTableBody = (): ReactElement => {
    return (
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={columnCount}>{renderLoadingState()}</td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={columnCount}>{renderErrorState()}</td>
          </tr>
        ) : sortedData.length === 0 ? (
          <tr>
            <td colSpan={columnCount}>{renderEmptyState()}</td>
          </tr>
        ) : (
          displayData.map((item, index) => renderTableRow(item, index))
        )}
      </tbody>
    );
  };

  // Render column toggle dropdown
  const renderColumnToggle = (): ReactElement | null => {
    if (!enableColumnToggle) return null;

    return (
      <div className="relative">
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors"
          onClick={() => setShowColumnToggle(!showColumnToggle)}
          title="Toggle columns visibility"
        >
          <Settings className="w-4 h-4" />
        </button>

        {showColumnToggle && (
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
            <div className="p-2">
              {columns.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      col.isRequired || columnVisibility[col.id] !== false
                    }
                    onChange={() => handleColumnToggle(col.id)}
                    disabled={col.isRequired}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">{col.label}</span>
                  {col.isRequired && (
                    <span className="text-xs text-muted-foreground">
                      (obrigatória)
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Number of active filters (for the toolbar badge)
  const activeFilterCount =
    Object.values(selectFilters).filter((v) => v).length +
    Object.values(dateFilters).filter((r) => r.from || r.to).length;

  const clearFilters = (): void => {
    setSelectFilters({});
    setDateFilters({});
  };

  // Render filters popover
  const renderFilters = (): ReactElement | null => {
    if (filters.length === 0) return null;

    return (
      <div className="relative">
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors relative"
          onClick={() => setShowFilters(!showFilters)}
          title="Filtros"
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="absolute right-0 mt-2 w-auto bg-background border border-border rounded-lg shadow-lg z-10 p-3 flex flex-col gap-3">
            {filters.map((f) => (
              <div key={f.id} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {f.label}
                </span>
                {f.type === "select" ? (
                  <select
                    className="h-8 text-sm rounded-md border border-border bg-background px-2"
                    value={selectFilters[f.id] ?? ""}
                    onChange={(e) =>
                      setSelectFilters((prev) => ({
                        ...prev,
                        [f.id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Todos</option>
                    {(filterOptions[f.id] ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      className="h-8 text-sm rounded-md border border-border bg-background px-2 flex-1 min-w-0"
                      value={dateFilters[f.id]?.from ?? ""}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          [f.id]: { ...prev[f.id], from: e.target.value },
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <input
                      type="date"
                      className="h-8 text-sm rounded-md border border-border bg-background px-2 flex-1 min-w-0"
                      value={dateFilters[f.id]?.to ?? ""}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          [f.id]: { ...prev[f.id], to: e.target.value },
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            ))}
            {activeFilterCount > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground self-start mt-1"
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render pagination
  const renderPagination = (): ReactElement => (
    <div className="flex items-center justify-between gap-4 border-t border-border p-3">
      <div className="text-sm text-muted-foreground">
        Mostrando{" "}
        <strong>
          {effectivePage * pageSize + 1}-{Math.min((effectivePage + 1) * pageSize, effectiveTotalElements)}
        </strong>{" "}
        de <strong>{effectiveTotalElements}</strong> registros
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => handlePageChange(effectivePage - 1)}
          disabled={effectivePage === 0}
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1">
          {Array.from({ length: effectiveTotalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              className={`px-2 py-1 rounded-md text-sm transition-colors ${
                i === effectivePage
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted"
              }`}
              onClick={() => handlePageChange(i)}
              disabled={i === effectivePage}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          className="p-2 hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => handlePageChange(effectivePage + 1)}
          disabled={effectivePage === effectiveTotalPages - 1}
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`w-full  flex flex-col ${cardClassName}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-4 border-b">
        <div className="flex-1 -ml-2">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableSearch && (
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-background">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={tableState.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-32 border-none bg-none outline-none flex-1 text-sm"
              />
            </div>
          )}

          {renderFilters()}

          {renderColumnToggle()}

          {headerExtra}

          {primaryAction && (
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon && (
                <primaryAction.icon className="w-4 h-4 inline-block mr-2" />
              )}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="min-h-[calc(6*45px+48px)] overflow-x-auto overflow-y-auto flex-1">
        <table className={`w-full border-collapse ${className}`}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Pagination */}
      {effectiveTotalPages > 1 &&
        !isLoading &&
        !error &&
        displayData.length > 0 &&
        renderPagination()}
    </div>
  );
}
