import { useState, useRef, useEffect, type ReactElement } from "react";
import { X } from "lucide-react";
import { createNote, type NoteCreateRequest } from "../../api/note";
import { ApiErrorResponse } from "../../api/errors";
import NoteEditor from "../NoteEditor/NoteEditor";
import { cn } from "../../lib/utils";
import styles from "./NewNoteComposer.module.css";
import { toast } from "sonner";

interface NewNoteComposerProps {
  onSave?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Quando fornecido, substitui a chamada à API. Ideal para mocks. */
  onSaveNote?: (note: NoteCreateRequest) => Promise<void>;
}

export default function NewNoteComposer({ onSave, open: controlledOpen, onOpenChange, onSaveNote }: NewNoteComposerProps): ReactElement {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  function setIsOpen(value: boolean): void {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  }
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 100, y: 80 });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMouseMove(e: MouseEvent): void {
      if (!isDragging.current) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
    function onMouseUp(): void {
      isDragging.current = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function handleHeaderMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }

  function open(): void {
    setIsOpen(true);
  }



  function close(): void {
    reset();
  }

  function handleCancel(): void {
    reset();
  }

  function reset(): void {
    setTitle("");
    setDescription("");
    setContent("");
    setError(null);
    setIsOpen(false);
  }

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (onSaveNote) {
        await onSaveNote({ title: title.trim(), content });
      } else {
        await createNote({ title: title.trim(), content });
      }
      toast.success("Nota criada com sucesso.");
      reset();
      onSave?.();
    } catch (e) {
      const message =
        e instanceof ApiErrorResponse
          ? e.getUserMessage()
          : e instanceof Error
            ? e.message
            : "Erro ao salvar nota.";

      toast.error("Falha ao criar nota.", {
        description: message,
      });

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
    if (isControlled) return <></>;
    return (
      <button
        className="fixed bottom-6 right-6 px-5 py-2.5 bg-primary text-primary-foreground border-none rounded-full text-sm font-semibold cursor-pointer shadow-lg hover:opacity-90 transition-opacity z-[100]"
        type="button"
        onClick={open}
      >
        + Nova Nota
      </button>
    );
  }

  return (
    <div
      className={cn(
        styles.modal,
        "bg-card border border-border rounded-xl shadow-2xl flex flex-col"
      )}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className={cn(styles.header, "flex items-center justify-between px-4 py-3 border-b border-border rounded-t-xl")}
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="text-sm font-semibold text-foreground">Nova nota</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-accent cursor-pointer border-none bg-transparent"
          title="Fechar"
          onClick={close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className={cn(styles.body, "flex flex-col")}>
        <input
          className="px-4 py-3 bg-transparent border-none border-b border-border text-foreground text-sm font-medium outline-none w-full placeholder:text-muted-foreground"
          style={{ borderBottom: "1px solid var(--border)" }}
          type="text"
          placeholder="Nome da nota"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          disabled={saving}
        />
        <input
          className="px-4 py-3 bg-transparent border-none text-foreground text-sm outline-none w-full placeholder:text-muted-foreground"
          style={{ borderBottom: "1px solid var(--border)" }}
          type="text"
          placeholder="Descrição da nota"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
        />
        <NoteEditor content={content} onChange={setContent} />
      </div>

      {/* Footer */}
      <div className={cn(styles.footer, "flex items-center justify-end gap-2 px-4 py-3 border-t border-border")}>
        {error && (
          <span className="flex-1 text-destructive text-xs">{error}</span>
        )}
        <button
          className="px-4 py-1.5 bg-transparent border border-border rounded-md text-muted-foreground text-xs font-medium cursor-pointer hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          className="px-4 py-1.5 bg-primary text-primary-foreground border-none rounded-md text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          disabled={saving || (!title.trim() && !content.trim())}
          onClick={() => void handleSave()}
        >
          {saving ? "Salvando…" : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}
