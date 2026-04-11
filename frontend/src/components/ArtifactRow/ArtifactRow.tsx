import { type ReactElement } from "react";
import { ArtifactContentTypes, type ArtifactContentType, type ArtifactResponse } from "../../api/artifact";
import ArtifactExpandedContent from "../ArtifactExpandedContent/ArtifactExpandedContent";
import styles from "./ArtifactRow.module.css";

const CONTENT_TYPE_LABELS: Record<ArtifactContentType, string> = {
  [ArtifactContentTypes.Document]: "Documento",
  [ArtifactContentTypes.Image]: "Imagem",
  [ArtifactContentTypes.Note]: "Nota",
};

function getBadgeClass(contentType: ArtifactContentType): string {
  if (contentType === ArtifactContentTypes.Document) return styles.badgeDocument;
  if (contentType === ArtifactContentTypes.Image) return styles.badgeImage;
  return styles.badgeNote;
}

interface ArtifactRowProps {
  artifact: ArtifactResponse;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: (id: number) => void;
  onToggleExpand: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
}

export default function ArtifactRow({
  artifact,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onDownload,
}: ArtifactRowProps): ReactElement {
  return (
    <>
      <tr className={`${styles.row} ${isExpanded ? styles.rowExpanded : ""}`}>
        <td className={styles.td}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isSelected}
            onChange={() => onToggleSelect(artifact.id)}
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
            onClick={() => onToggleExpand(artifact.id)}
          >
            {isExpanded ? "▴" : "▾"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={6} className={styles.expandedCell}>
            <ArtifactExpandedContent
              artifact={artifact}
              onEdit={onEdit}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          </td>
        </tr>
      )}
    </>
  );
}
