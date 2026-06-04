import type { ReactElement, ReactNode } from "react";

export type ColumnDataType = "text" | "date" | "enum" | "number" | "custom";

export interface ColumnDefinition<T> {
  /** Unique identifier for the column */
  id: string;
  /** Display label for the column header */
  label: string;
  /** Data type for sorting and filtering */
  dataType?: ColumnDataType;
  /** CSS classes for the header cell */
  headClassName?: string;
  /** CSS classes for regular cells */
  cellClassName?: string;
  /** Function to render cell content */
  renderCell: (item: T) => ReactElement | string;
  /** Optional: function to extract sortable value for this column */
  getSortValue?: (item: T) => string | number | Date | null;
  /** Optional: is this column required (always visible) */
  isRequired?: boolean;
  /** Optional: width percentage or fixed width */
  width?: string;
}

/**
 * A header filter, decoupled from the visible columns so it can target fields
 * that aren't shown (e.g. "Quem criou"). Applied client-side before search/sort.
 */
export type FilterDefinition<T> =
  | {
      id: string;
      label: string;
      type: "select";
      /** Value used to match and to build the distinct option list */
      getValue: (item: T) => string | null;
    }
  | {
      id: string;
      label: string;
      type: "dateRange";
      /** ISO date string used for range comparison */
      getValue: (item: T) => string | null;
    };

export interface GenericTableProps<T> {
  /** Unique identifier for the table (used for localStorage) */
  tableId: string;
  /** Array of items to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Enable client-side pagination (component manages page state internally) */
  clientPagination?: boolean;
  /** Enable client-side search filtering across getSortValue of all columns */
  clientSearch?: boolean;
  /** Current page (0-indexed) — required for server-side, unused when clientPagination=true */
  page?: number;
  /** Total number of pages — required for server-side, computed when clientPagination=true */
  totalPages?: number;
  /** Total number of items — required for server-side, computed when clientPagination=true */
  totalElements?: number;
  /** Items per page */
  pageSize?: number;
  /** Is data loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Callback when page changes — required for server-side, unused when clientPagination=true */
  onPageChange?: (page: number) => void;
  /** Callback when column visibility changes — receives the toggled id and the new visibility map */
  onColumnToggle?: (
    columnId: string,
    visibility: Record<string, boolean>,
  ) => void;
  /**
   * Extracts a stable id per row, used for React keys and expansion tracking.
   * Defaults to `item.id` when present, otherwise the row index.
   */
  getRowId?: (item: T, index: number) => string;
  /** Default column visibility config */
  defaultColumnConfig?: { [columnId: string]: boolean };
  /** Title for the table */
  title?: string;
  /** Subtitle for the table */
  subtitle?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  /** Row actions (edit, delete, etc.) */
  rowActions?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: (item: T) => void;
    variant?: "default" | "destructive";
  }[];
  /** Empty state message */
  emptyMessage?: string;
  /** Enable column sorting */
  enableSorting?: boolean;
  /** Enable search filter */
  enableSearch?: boolean;
  /** Search value */
  searchValue?: string;
  /** Callback when search changes */
  onSearchChange?: (value: string) => void;
  /** Enable column visibility toggle */
  enableColumnToggle?: boolean;
  /** Custom class names */
  className?: string;
  /** Card container class */
  cardClassName?: string;
  /**
   * Optional: render expandable content below a row. The `close` helper collapses
   * the expanded row from within the content (e.g. an internal close button).
   */
  expandableContent?: (item: T, helpers: { close: () => void }) => ReactNode;
  /** Optional: extra content rendered in the header toolbar, before the primary action */
  headerExtra?: ReactNode;
  /** Optional: called when a row is clicked. Mutually exclusive with expandableContent. */
  onRowClick?: (item: T) => void;
  /** Optional: header filters (select / date range), applied client-side */
  filters?: FilterDefinition<T>[];
}

export interface TableState {
  sortColumn: string | null;
  sortDirection: "asc" | "desc" | null;
  searchQuery: string;
}
