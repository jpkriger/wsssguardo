import { type ReactElement } from "react";
import { Filter } from "lucide-react";
import ColumnVisibilityDropdown from "../ColumnVisibilityToggle/ColumnVisibilityDropdown";
import type { ColumnConfig } from "@/hooks/use-table-columns";

interface CategoryFilterProps {
  columns: { id: string; label: string }[];
  visibleColumns: ColumnConfig;
  onToggleColumn: (columnId: string) => void;
  onReset: () => void;
}

export default function CategoryFilter({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
}: CategoryFilterProps): ReactElement {
  return (
    <ColumnVisibilityDropdown
      columns={columns}
      visibleColumns={visibleColumns}
      onToggleColumn={onToggleColumn}
      onReset={onReset}
      label="Categoria"
      icon={Filter}
    />
  );
}