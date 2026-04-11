import { useRef, type ReactElement } from "react";
import NoteToolbar from "../NoteToolbar/NoteToolbar";
import styles from "./NoteEditor.module.css";

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      newContent = content.slice(0, lineStart) + fmt.prefix + content.slice(lineStart);
      newCursor = start + fmt.prefix.length;
    } else {
      newContent =
        content.slice(0, start) + fmt.before + selected + fmt.after + content.slice(end);
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
      <NoteToolbar onAction={applyFormat} />
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder="Escreva sua nota aqui..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}