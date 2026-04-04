import { useState, type ReactElement } from "react";
import NoteEditor from "../NoteEditor/NoteEditor";
import styles from "./NewNoteComposer.module.css";

export default function NewNoteComposer(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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
    setTitle("");
    setContent("");
    setIsOpen(false);
    setIsMinimized(false);
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
    setTitle("");
    setContent("");
    setIsOpen(false);
    setIsMinimized(false);
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
              onChange={(e) => setTitle(e.target.value)}
            />
            <NoteEditor content={content} onChange={setContent} />
          </div>
          <div className={styles.footer}>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button
              className={styles.saveBtn}
              type="button"
              disabled={!title.trim() && !content.trim()}
            >
              Salvar
            </button>
          </div>
        </>
      )}
    </div>
  );
}