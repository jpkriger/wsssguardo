import { type ReactElement } from "react";
import { ArtifactContentTypes, type ArtifactContentType, type ArtifactFilterState } from "../../api/artifact";

const CONTENT_TYPE_OPTIONS: { value: ArtifactContentType; label: string }[] = [
  { value: ArtifactContentTypes.Document, label: "Documento" },
  { value: ArtifactContentTypes.Image, label: "Imagem" },
  { value: ArtifactContentTypes.Note, label: "Nota" },
];

interface ArtifactFiltersProps {
  filters: ArtifactFilterState;
  authors: string[];
  onChange: (filters: ArtifactFilterState) => void;
}

export default function ArtifactFilters({
  filters,
  authors,
  onChange,
}: ArtifactFiltersProps): ReactElement {
  function set(patch: Partial<ArtifactFilterState>): void {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <input
        className="flex-1 min-w-48 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm outline-none transition-colors focus:border-ring placeholder:text-muted-foreground"
        type="search"
        placeholder="Buscar por nome…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />
      <select
        className="px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm outline-none cursor-pointer transition-colors focus:border-ring min-w-40"
        value={filters.contentType}
        onChange={(e) =>
          set({ contentType: e.target.value as ArtifactContentType | "" })
        }
      >
        <option value="">Todos os tipos</option>
        {CONTENT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm outline-none cursor-pointer transition-colors focus:border-ring min-w-40"
        value={filters.author}
        onChange={(e) => set({ author: e.target.value })}
      >
        <option value="">Todos os autores</option>
        {authors.map((author) => (
          <option key={author} value={author}>
            {author}
          </option>
        ))}
      </select>
    </div>
  );
}
