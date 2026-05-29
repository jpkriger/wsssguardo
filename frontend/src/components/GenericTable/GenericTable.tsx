import { ReactElement, useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import type { GenericTableProps, TableState } from "./types";
import "./GenericTable.css";

/**
 * GenericTable - Reusable table component with sorting, pagination, search, and column visibility
 */
export default function GenericTable<T>({
  tableId,
  data,
  columns,
  page,
  totalPages,
  totalElements,
  pageSize,
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
}: GenericTableProps<T>): ReactElement {
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
        return JSON.parse(saved);
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
      {}
    );
  });

  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Sync search value from props
  useEffect(() => {
    setTableState((prev) => ({
      ...prev,
      searchQuery: searchValue,
    }));
  }, [searchValue]);

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
            JSON.stringify(newVisibility)
          );
        } catch {
          console.warn(`Failed to save column visibility for table ${tableId}`);
        }
        onColumnToggle?.(columnId);
        return newVisibility;
      });
    },
    [tableId, onColumnToggle]
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
    [enableSorting]
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
    [onSearchChange]
  );

  // Visible columns
  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (col) => col.isRequired || columnVisibility[col.id] !== false
      ),
    [columns, columnVisibility]
  );

  // Sorted and paginated data
  const sortedData = useMemo(() => {
    if (!enableSorting || !tableState.sortColumn || !tableState.sortDirection) {
      return data;
    }

    const column = columns.find((col) => col.id === tableState.sortColumn);
    if (!column || !column.getSortValue) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = column.getSortValue!(a);
      const bValue = column.getSortValue!(b);

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return tableState.sortDirection === "asc" ? 1 : -1;
      if (bValue == null) return tableState.sortDirection === "asc" ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return tableState.sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, columns, enableSorting, tableState.sortColumn, tableState.sortDirection]);

  // Render sort indicator
  const renderSortIndicator = (columnId: string): string | null => {
    if (!enableSorting || tableState.sortColumn !== columnId) return null;
    return (tableState.sortDirection === "asc" ? "↑" : "↓") as string;
  };

  // Render header
  const renderTableHeader = (): ReactElement => (
    <thead className="bg-muted">
      <tr>
        {visibleColumns.map((col) => (
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
              {renderSortIndicator(col.id) && (
                <span className="sort-indicator">
                  {renderSortIndicator(col.id)}
                </span>
              )}
            </div>
          </th>
        ))}
        {rowActions.length > 0 && (
          <th className="px-2 py-5 text-left text-sm font-semibold">Ações</th>
        )}
      </tr>
    </thead>
  );

  // Render row
  const renderTableRow = (item: T, index: number): ReactElement => (
    <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
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
                className={`generic-table-action-button ${
                  action.variant === "destructive"
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground"
                }`}
                onClick={() => action.onClick(item)}
                title={action.label}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </td>
      )}
    </tr>
  );

  // Render empty state
  const renderEmptyState = (): ReactElement => (
    <div className="generic-table-empty-state">
      <svg
        className="generic-table-empty-state-icon"
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
    <div className="generic-table-loading">
      <div className="generic-table-loading-spinner">
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
  const renderTableBody = (): ReactElement => (
    <tbody>
      {isLoading ? (
        <tr>
          <td colSpan={visibleColumns.length + (rowActions.length > 0 ? 1 : 0)}>
            {renderLoadingState()}
          </td>
        </tr>
      ) : error ? (
        <tr>
          <td colSpan={visibleColumns.length + (rowActions.length > 0 ? 1 : 0)}>
            {renderErrorState()}
          </td>
        </tr>
      ) : sortedData.length === 0 ? (
        <tr>
          <td colSpan={visibleColumns.length + (rowActions.length > 0 ? 1 : 0)}>
            {renderEmptyState()}
          </td>
        </tr>
      ) : (
        sortedData.map((item, index) => renderTableRow(item, index))
      )}
    </tbody>
  );

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

  // Render pagination
  const renderPagination = (): ReactElement => (
    <div className="generic-table-pagination" style={{ padding: "12px 8px" }}>
      <div className="generic-table-pagination-info">
        Mostrando{" "}
        <strong>
          {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)}
        </strong>{" "}
        de <strong>{totalElements}</strong> registros
      </div>
      <div className="generic-table-pagination-controls">
        <button
          className="p-2 hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              className={`px-2 py-1 rounded-md text-sm transition-colors ${
                i === page
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted"
              }`}
              onClick={() => onPageChange(i)}
              disabled={i === page}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          className="p-2 hover:bg-muted rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages - 1}
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`generic-table-card ${cardClassName}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-4 border-b">
        <div className="flex-1 -ml-2">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {enableSearch && (
            <div className="generic-table-search-input">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={tableState.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          {renderColumnToggle()}

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
      <div className="generic-table-wrapper flex-1">
        <table className={`w-full border-collapse ${className}`}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && !error && sortedData.length > 0 && renderPagination()}
    </div>
  );
}
