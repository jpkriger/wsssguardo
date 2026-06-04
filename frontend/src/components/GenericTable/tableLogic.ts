import type { ColumnDefinition, FilterDefinition } from "./types";

/**
 * Pure data-pipeline helpers for GenericTable. Kept free of React so the
 * filtering / sorting / pagination behaviour can be unit-tested directly.
 */

/** Resolves a stable row id: explicit getRowId, then `item.id`, then the index. */
export function resolveRowId<T>(
  item: T,
  index: number,
  getRowId?: (item: T, index: number) => string,
): string {
  if (getRowId) return getRowId(item, index);
  const maybe = (item as { id?: string | number }).id;
  return maybe != null ? String(maybe) : String(index);
}

/** Distinct, sorted option values for a select filter, derived from the data. */
export function getFilterOptions<T>(
  data: T[],
  filter: FilterDefinition<T>,
): string[] {
  return Array.from(
    new Set(
      data
        .map((item) => filter.getValue(item))
        .filter((v): v is string => !!v && v.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

/** Applies select + date-range header filters (AND across filters). */
export function applyFilters<T>(
  data: T[],
  filters: FilterDefinition<T>[],
  selectFilters: Record<string, string>,
  dateFilters: Record<string, { from?: string; to?: string }>,
): T[] {
  if (filters.length === 0) return data;
  return data.filter((item) =>
    filters.every((f) => {
      if (f.type === "select") {
        const selected = selectFilters[f.id];
        if (!selected) return true;
        return f.getValue(item) === selected;
      }
      // dateRange — compare on the ISO date part (YYYY-MM-DD) so the result is
      // timezone-independent and consistent with how dates are displayed.
      const { from, to } = dateFilters[f.id] ?? {};
      if (!from && !to) return true;
      const raw = f.getValue(item);
      if (!raw) return false;
      const day = raw.slice(0, 10);
      if (day.length < 10) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    }),
  );
}

/** Client-side text search across every column that exposes getSortValue. */
export function applySearch<T>(
  data: T[],
  columns: ColumnDefinition<T>[],
  query: string,
): T[] {
  if (!query.trim()) return data;
  const q = query.toLowerCase();
  return data.filter((item) =>
    columns.some((col) => {
      if (!col.getSortValue) return false;
      const val = col.getSortValue(item);
      return val != null && String(val).toLowerCase().includes(q);
    }),
  );
}

/** Stable sort by a column's getSortValue, nulls last, asc/desc. */
export function sortRows<T>(
  data: T[],
  column: ColumnDefinition<T> | undefined,
  direction: "asc" | "desc" | null,
): T[] {
  if (!column || !column.getSortValue || !direction) return data;
  const getValue = column.getSortValue;
  return [...data].sort((a, b) => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === "asc" ? 1 : -1;
    if (bValue == null) return direction === "asc" ? -1 : 1;
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    return direction === "asc" ? comparison : -comparison;
  });
}

/** Total client pages for a row count (never below 1). */
export function totalClientPages(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}

/** Clamps a page index into [0, totalPages - 1]. */
export function clampPage(page: number, totalPages: number): number {
  if (page > totalPages - 1) return Math.max(0, totalPages - 1);
  return Math.max(0, page);
}
