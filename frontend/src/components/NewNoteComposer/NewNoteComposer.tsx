import { useState, useRef, useEffect, useCallback, type ReactElement } from "react";
import { X } from "lucide-react";
import { createNote, type NoteCreateRequest } from "../../api/note";
import { ApiErrorResponse } from "../../api/errors";
import NoteEditor from "../NoteEditor/NoteEditor";
import { toast } from "sonner";

interface NewNoteComposerProps {
  onSave?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Quando fornecido, substitui a chamada à API. Ideal para mocks. */
  onSaveNote?: (note: NoteCreateRequest) => Promise<void>;
  /**
   * Posição inicial da nota ao abrir (em pixels a partir do canto superior esquerdo da tela).
   * Padrão: { x: 100, y: 80 }
   */
  initialPosition?: { x: number; y: number };
}

const DEFAULT_POSITION = { x: 100, y: 80 };
const DEFAULT_SIZE = { width: 480, height: 400 };

export default function NewNoteComposer({
  onSave,
  open: controlledOpen,
  onOpenChange,
  onSaveNote,
  initialPosition = DEFAULT_POSITION,
}: NewNoteComposerProps): ReactElement {
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

  // ── Posição (drag) ─────────────────────────────────────────────────────────
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 100, y: 80 });

  // ── Tamanho (resize customizado) ────────────────────────────────────────────
  const [size, setSize] = useState(DEFAULT_SIZE);
  const isResizing = useRef(false);
  const resizeOrigin = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0, width: 0, height: 0 });

  // ── Reposiciona para o canto inferior direito sempre que o modal abre ───────
  useEffect(() => {
    if (isOpen) {
      const padding = 24;
      const x = window.innerWidth - DEFAULT_SIZE.width - padding;
      const y = window.innerHeight - DEFAULT_SIZE.height - padding;
      setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
      setSize(DEFAULT_SIZE);
    }
  }, [isOpen]);

  // ── Listeners globais de mouse ──────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Drag
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }

    // Resize pelo canto superior esquerdo:
    // - arrastar para esquerda → aumenta largura e move para esquerda
    // - arrastar para cima     → aumenta altura e move para cima
    if (isResizing.current) {
      const { mouseX, mouseY, posX, posY, width, height } = resizeOrigin.current;
      const dx = mouseX - e.clientX; // invertido: esquerda = positivo
      const dy = mouseY - e.clientY; // invertido: cima = positivo

      const newWidth = Math.max(380, width + dx);
      const newHeight = Math.max(400, height + dy);
      const newX = posX - (newWidth - width);
      const newY = posY - (newHeight - height);

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleHeaderMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }

  function handleResizeMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
      width: size.width,
      height: size.height,
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
      toast.error("Falha ao criar nota.");
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Erro ao salvar nota.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
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
      className="fixed z-[100] w-[480px] min-w-[380px] min-h-[400px] max-w-[90vw] max-h-[90vh] overflow-hidden bg-card border border-border rounded-xl shadow-2xl flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Handle de resize — canto superior esquerdo */}
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10 group"
        onMouseDown={handleResizeMouseDown}
        title="Redimensionar"
      >
        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-muted-foreground opacity-50 group-hover:opacity-100" />
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-xl cursor-grab select-none flex-shrink-0"
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
      <div className="flex flex-col flex-1 overflow-y-auto">
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
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
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
