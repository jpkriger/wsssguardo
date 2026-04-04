import { useMemo, useRef, useState, type ReactElement } from "react";
import { marked } from "marked";
import NoteToolbar from "../NoteToolbar/NoteToolbar";
import styles from "./NoteEditor.module.css";

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
}

type EditorTab = "write" | "preview";

interface FormatRule {
  before: string;
  after: string;
  prefix: string;
}

const FORMAT_MAP: Record<string, FormatRule> = {
  bold: { before: "**", after: "**", prefix: "" },
  italic: { before: "*", after: "*", prefix: "" },
  underline: { before: "<u>", after: "</u>", prefix: "" },
  h1: { before: "", after: "", prefix: "# " },
  h2: { before: "", after: "", prefix: "## " },
  h3: { before: "", after: "", prefix: "### " },
  list: { before: "", after: "", prefix: "- " },
};

export default function NoteEditor({ content, onChange }: NoteEditorProps): ReactElement {
  const [tab, setTab] = useState<EditorTab>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const preview = useMemo(() => {
    const result = marked.parse(content);
    return typeof result === "string" ? result : "";
  }, [content]);

  function applyFormat(action: string): void {
    const el = textareaRef.current;
    if (!el) return;
    const fmt = FORMAT_MAP[action];
    if (!fmt) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = content.slice(start, end);
    let newContent: string;
    let newCursor: number;
    if (fmt.prefix) {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      newContent =
        content.slice(0, lineStart) + fmt.prefix + content.slice(lineStart);
      newCursor = start + fmt.prefix.length;
    } else {
      newContent =
        content.slice(0, start) +
        fmt.before +
        selected +
        fmt.after +
        content.slice(end);
      newCursor = end + fmt.before.length + fmt.after.length;
    }
    onChange(newContent);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  return (
    <div className={styles.editor}>
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "write" ? styles.tabActive : ""}`}
          onClick={() => setTab("write")}
        >
          Escrever
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "preview" ? styles.tabActive : ""}`}
          onClick={() => setTab("preview")}
        >
          Visualizar
        </button>
        {tab === "write" && <NoteToolbar onAction={applyFormat} />}
      </div>
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Escreva em markdown..."
          value={content}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
    </div>
  );
}