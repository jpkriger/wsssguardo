import { type ReactElement } from "react";
import { ChevronDown, Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnConfig } from "@/hooks/use-table-columns";

interface ColumnVisibilityDropdownProps {
  columns: { id: string; label: string }[];
  visibleColumns: ColumnConfig;
  onToggleColumn: (columnId: string) => void;
  onReset?: () => void;
  label?: string;
  icon?: LucideIcon;
}

export default function ColumnVisibilityDropdown({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
  label = "Colunas",
  icon: Icon = Settings,
}: ColumnVisibilityDropdownProps): ReactElement {
  const activeCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="relative inline-block group">
      <Button variant="outline" size="sm" className="gap-2">
        <Icon className="size-4" />
        {label}{activeCount > 0 ? ` (${activeCount})` : ""}
        <ChevronDown className="size-4" />
      </Button>

      <div className="absolute right-0 top-full pt-1 w-72 hidden group-hover:block">
        <div className="bg-background border border-input rounded-lg shadow-lg z-50 p-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors"
            >
              <input
                type="checkbox"
                id={col-${column.id}}
                checked={visibleColumns[column.id] ?? true}
                onChange={() => onToggleColumn(column.id)}
                className="w-4 h-4 cursor-pointer rounded border-input"
              />
              <label htmlFor={col-${column.id}} className="text-sm cursor-pointer flex-1">
                {column.label}
              </label>
            </div>
          ))}
        </div>

        {onReset && (
          <div className="mt-4 pt-4 border-t border-input">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onReset}>
              Resetar para padrão
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}