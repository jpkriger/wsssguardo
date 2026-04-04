import { useState, type ReactElement } from "react";
import { createNote } from "../../api/note";
import { ApiErrorResponse } from "../../api/errors";
import NoteEditor from "../NoteEditor/NoteEditor";
import styles from "./NewNoteComposer.module.css";

interface NewNoteComposerProps {
  onSave?: () => void;
}

export default function NewNoteComposer({ onSave }: NewNoteComposerProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = title.trim().length > 0 || content.trim().length > 0;

  function open(): void {
    setIsOpen(true);
    setIsMinimized(false);
  }

  function close(): void {
    if (
      hasChanges &&
      !window.confirm("Existem alterações não salvas. Deseja fechar mesmo assim?")
    ) {
      return;
    }
    reset();
  }

  function toggleMinimize(): void {
    setIsMinimized((prev) => !prev);
  }

  function handleCancel(): void {
    if (
      hasChanges &&
      !window.confirm("Existem alterações não salvas. Deseja cancelar mesmo assim?")
    ) {
      return;
    }
    reset();
  }

  function reset(): void {
    setTitle("");
    setContent("");
    setError(null);
    setIsOpen(false);
    setIsMinimized(false);
  }

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createNote({ title: title.trim(), content });
      reset();
      onSave?.();
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Erro ao salvar nota.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button className={styles.fab} type="button" onClick={open}>
        + Nova Nota
      </button>
    );
  }

  return (
    <div className={styles.composer}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Nova Nota</span>
        <div className={styles.headerActions}>
          <button
            className={styles.headerBtn}
            type="button"
            title={isMinimized ? "Expandir" : "Minimizar"}
            onClick={toggleMinimize}
          >
            {isMinimized ? "▲" : "—"}
          </button>
          <button
            className={styles.headerBtn}
            type="button"
            title="Fechar"
            onClick={close}
          >
            ✕
          </button>
        </div>
      </div>
      {!isMinimized && (
        <>
          <div className={styles.body}>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              disabled={saving}
            />
            <NoteEditor content={content} onChange={setContent} />
          </div>
          <div className={styles.footer}>
            {error && <span className={styles.footerError}>{error}</span>}
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className={styles.saveBtn}
              type="button"
              disabled={saving || (!title.trim() && !content.trim())}
              onClick={() => void handleSave()}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}