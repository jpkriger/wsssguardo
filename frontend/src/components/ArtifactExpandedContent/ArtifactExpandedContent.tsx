import { type ReactElement } from "react";
import { type ArtifactResponse } from "../../api/artifact";
import styles from "./ArtifactExpandedContent.module.css";

interface ArtifactExpandedContentProps {
  artifact: ArtifactResponse;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
}

function DocumentPreview({ description }: { description: string }): ReactElement {
  return <pre className={styles.previewDocument}>{description}</pre>;
}

function ImagePreview({ description, name }: { description: string; name: string }): ReactElement {
  return (
    <div className={styles.previewImage}>
      <img src={description} alt={name} className={styles.image} />
    </div>
  );
}

function NotePreview({ description }: { description: string }): ReactElement {
  return <div className={styles.previewNote}>{description}</div>;
}

export default function ArtifactExpandedContent({
  artifact,
  onEdit,
  onDelete,
  onDownload,
}: ArtifactExpandedContentProps): ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        {artifact.contentType === "document" && (
          <DocumentPreview description={artifact.description} />
        )}
        {artifact.contentType === "image" && (
          <ImagePreview description={artifact.description} name={artifact.name} />
        )}
        {artifact.contentType === "note" && (
          <NotePreview description={artifact.description} />
        )}
      </div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
          onClick={() => onEdit(artifact.id)}
        >
          Editar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDownload}`}
          onClick={() => onDownload(artifact.id)}
        >
          Baixar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
          onClick={() => onDelete(artifact.id)}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
