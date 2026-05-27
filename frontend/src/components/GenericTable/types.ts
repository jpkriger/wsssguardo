import type { ReactElement } from "react";

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

export interface GenericTableProps<T> {
  /** Unique identifier for the table (used for localStorage) */
  tableId: string;
  /** Array of items to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Current page (0-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalElements: number;
  /** Items per page */
  pageSize: number;
  /** Is data loading */
  isLoading: boolean;
  /** Error message if any */
  error?: string | null;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when column visibility changes */
  onColumnToggle?: (columnId: string) => void;
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
}

export interface TableState {
  sortColumn: string | null;
  sortDirection: "asc" | "desc" | null;
  searchQuery: string;
}
