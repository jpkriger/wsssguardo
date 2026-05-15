import { useRef, useEffect, useState, type ReactElement } from "react";
import NoteToolbar from "../NoteToolbar/NoteToolbar";

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const STATE_COMMANDS: Record<string, string> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  list: "insertUnorderedList",
};

function getActiveFormats(editorEl: HTMLDivElement | null): Set<string> {
  if (!editorEl) return new Set();
  const active = new Set<string>();
  for (const [id, cmd] of Object.entries(STATE_COMMANDS)) {
    try {
      if (document.queryCommandState(cmd)) active.add(id);
    } catch {
      // ignore unsupported commands
    }
  }
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editorEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName.toLowerCase();
        if (tag === "h1") active.add("h1");
        else if (tag === "h2") active.add("h2");
        else if (tag === "h3") active.add("h3");
      }
      node = node.parentNode;
    }
  }
  return active;
}

export default function NoteEditor({ content, onChange }: NoteEditorProps): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleSelectionChange(): void {
      const sel = window.getSelection();
      if (!sel || !editorRef.current) return;
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          setActiveFormats(getActiveFormats(editorRef.current));
        }
      }
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  function applyFormat(action: string): void {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    switch (action) {
      case "bold":
        document.execCommand("bold", false, undefined);
        break;
      case "italic":
        document.execCommand("italic", false, undefined);
        break;
      case "underline":
        document.execCommand("underline", false, undefined);
        break;
      case "h1":
        document.execCommand("formatBlock", false, "h1");
        break;
      case "h2":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "h3":
        document.execCommand("formatBlock", false, "h3");
        break;
      case "list":
        document.execCommand("insertUnorderedList", false, undefined);
        break;
    }
    onChange(el.innerHTML);
    setActiveFormats(getActiveFormats(el));
  }

  return (
    <div className="flex flex-col flex-1">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="flex-1 px-4 py-3 bg-transparent text-foreground text-sm leading-7 outline-none min-h-[160px] w-full font-sans"
        style={{ wordBreak: "break-word" }}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        onInput={() => {
          if (!isComposing.current && editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        onKeyUp={() => setActiveFormats(getActiveFormats(editorRef.current))}
        onMouseUp={() => setActiveFormats(getActiveFormats(editorRef.current))}
      />
      <NoteToolbar onAction={applyFormat} activeFormats={activeFormats} />
    </div>
  );
}