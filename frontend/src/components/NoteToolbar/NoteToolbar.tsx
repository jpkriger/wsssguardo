import { type ReactElement } from "react";
import styles from "./NoteToolbar.module.css";

const ACTIONS = [
  { id: "bold", label: "B", title: "Negrito" },
  { id: "italic", label: "I", title: "Itálico" },
  { id: "underline", label: "U", title: "Sublinhado" },
  { id: "h1", label: "H1", title: "Título 1" },
  { id: "h2", label: "H2", title: "Título 2" },
  { id: "h3", label: "H3", title: "Título 3" },
  { id: "list", label: "≡", title: "Lista" },
] as const;

type ToolbarActionId = (typeof ACTIONS)[number]["id"];

interface NoteToolbarProps {
  onAction: (action: ToolbarActionId) => void;
}

export default function NoteToolbar({ onAction }: NoteToolbarProps): ReactElement {
  return (
    <div className={styles.toolbar}>
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className={styles.btn}
          title={action.title}
          onMouseDown={(e) => {
            e.preventDefault();
            onAction(action.id);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}