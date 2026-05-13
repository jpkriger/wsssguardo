import { useState, useCallback } from "react";

export type ColumnConfig = {
  [key: string]: boolean;
};

export function useTableColumns(
  tableId: string,
  defaultColumns: ColumnConfig,
): {
  visibleColumns: ColumnConfig;
  toggleColumn: (columnId: string) => void;
  getVisibleColumnIds: () => string[];
  resetColumns: () => void;
} {
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>(() => {
    const saved = localStorage.getItem(`table-columns-${tableId}`);
    return saved ? (JSON.parse(saved) as ColumnConfig) : defaultColumns;
  });

  const toggleColumn = useCallback(
    (columnId: string) => {
      setVisibleColumns((prev) => {
        const updated = { ...prev, [columnId]: !prev[columnId] };
        localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(updated));
        return updated;
      });
    },
    [tableId],
  );

  const getVisibleColumnIds = useCallback(
    () => Object.keys(visibleColumns).filter((col) => visibleColumns[col]),
    [visibleColumns],
  );

  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultColumns);
    localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(defaultColumns));
  }, [tableId, defaultColumns]);

  return { visibleColumns, toggleColumn, getVisibleColumnIds, resetColumns };
}