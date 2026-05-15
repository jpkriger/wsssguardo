import { type ReactElement } from "react";

const ACTIONS = [
  { id: "bold", label: "B", title: "Negrito" },
  { id: "italic", label: "I", title: "Itálico" },
  { id: "underline", label: "U", title: "Sublinhado" },
  { id: "list", label: "≡", title: "Lista" },
  { id: "h1", label: "H1", title: "Título 1" },
  { id: "h2", label: "H2", title: "Título 2" },
  { id: "h3", label: "H3", title: "Título 3" },
] as const;

type ToolbarActionId = (typeof ACTIONS)[number]["id"];

interface NoteToolbarProps {
  onAction: (action: ToolbarActionId) => void;
  activeFormats?: Set<string>;
}

export default function NoteToolbar({ onAction, activeFormats }: NoteToolbarProps): ReactElement {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-border bg-muted">
      {ACTIONS.map((action) => {
        const isActive = activeFormats?.has(action.id) ?? false;
        return (
          <button
            key={action.id}
            type="button"
            className={
              isActive
                ? "border-none text-foreground cursor-pointer text-xs font-bold px-1.5 py-1 rounded-sm min-w-6 text-center transition-colors font-sans bg-accent"
                : "bg-transparent border-none text-muted-foreground cursor-pointer text-xs font-bold px-1.5 py-1 rounded-sm min-w-6 text-center hover:text-foreground hover:bg-accent transition-colors font-sans"
            }
            title={action.title}
            onMouseDown={(e) => {
              e.preventDefault();
              onAction(action.id);
            }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}