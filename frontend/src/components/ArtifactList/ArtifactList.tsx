import { Fragment, useEffect, useState, type ReactElement } from "react";
import {
  listArtifacts,
  type ArtifactContentType,
  type ArtifactResponse,
} from "../../api/artifact";
import { ApiErrorResponse } from "../../api/errors";
import styles from "./ArtifactList.module.css";

const CONTENT_TYPE_LABELS: Record<ArtifactContentType, string> = {
  document: "Documento",
  image: "Imagem",
  note: "Nota",
};

function getBadgeClass(contentType: ArtifactContentType): string {
  if (contentType === "document") return styles.badgeDocument;
  if (contentType === "image") return styles.badgeImage;
  return styles.badgeNote;
}

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
                <Fragment key={artifact.id}>
                  <tr className={styles.row}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.has(artifact.id)}
                        onChange={() => toggleSelect(artifact.id)}
                      />
                    </td>
                    <td className={styles.td}>{artifact.name}</td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.badge} ${getBadgeClass(artifact.contentType)}`}
                      >
                        {CONTENT_TYPE_LABELS[artifact.contentType]}
                      </span>
                    </td>
                    <td className={styles.td}>{artifact.author}</td>
                    <td className={styles.td}>
                      {new Date(artifact.createdAt).toLocaleString()}
                    </td>
                    <td className={styles.td}>
                      <button
                        className={styles.expandBtn}
                        onClick={() => toggleExpand(artifact.id)}
                      >
                        {expandedId === artifact.id ? "▴" : "▾"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === artifact.id && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={6} className={styles.expandedCell}>
                        <p className={styles.description}>
                          {artifact.description}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
