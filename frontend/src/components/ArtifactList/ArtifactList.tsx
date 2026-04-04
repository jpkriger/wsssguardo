import { useEffect, useState, type ReactElement } from "react";
import { listArtifacts, type ArtifactResponse } from "../../api/artifact";
import { ApiErrorResponse } from "../../api/errors";
import ArtifactRow from "../ArtifactRow/ArtifactRow";
import styles from "./ArtifactList.module.css";

export default function ArtifactList(): ReactElement {
  const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setArtifacts(await listArtifacts());
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: number): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpand(id: number): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleEdit(_id: number): void {}
  function handleDelete(_id: number): void {}
  function handleDownload(_id: number): void {}

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Artefatos</h2>
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.muted}>Carregando…</p>}
      {!loading && artifacts.length === 0 && !error && (
        <p className={styles.empty}>Nenhum artefato encontrado.</p>
      )}
      {artifacts.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} />
                <th className={styles.th}>Nome</th>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Autor</th>
                <th className={styles.th}>Criado em</th>
                <th className={styles.th} />
              </tr>
            </thead>
            <tbody>
              {artifacts.map((artifact) => (
                <ArtifactRow
                  key={artifact.id}
                  artifact={artifact}
                  isSelected={selectedIds.has(artifact.id)}
                  isExpanded={expandedId === artifact.id}
                  onToggleSelect={toggleSelect}
                  onToggleExpand={toggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
