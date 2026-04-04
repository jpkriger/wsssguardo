import { useState, type ReactElement } from "react";
import NoteEditor from "../NoteEditor/NoteEditor";
import styles from "./NewNoteComposer.module.css";

export default function NewNoteComposer(): ReactElement {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleCancel(): void {
    setTitle("");
    setContent("");
  }

  return (
    <div className={styles.composer}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Nova Nota</span>
      </div>
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
        <button className={styles.cancelBtn} type="button" onClick={handleCancel}>
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
    </div>
  );
}