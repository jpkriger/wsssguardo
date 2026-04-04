import { type ReactElement } from "react";
import { type ArtifactContentType, type ArtifactFilterState } from "../../api/artifact";
import styles from "./ArtifactFilters.module.css";

const CONTENT_TYPE_OPTIONS: { value: ArtifactContentType; label: string }[] = [
  { value: "document", label: "Documento" },
  { value: "image", label: "Imagem" },
  { value: "note", label: "Nota" },
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
    <div className={styles.wrapper}>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="Buscar por nome…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />
      <select
        className={styles.select}
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
        className={styles.select}
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
