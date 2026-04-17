import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import {
  ArtifactContentTypes,
  type ArtifactContentType,
  type ArtifactResponse,
} from "../../api/artifact";
import NoteEditor from "../NoteEditor/NoteEditor";
import { cn } from "../../lib/utils";

interface ArtifactExpandedContentProps {
  artifact: ArtifactResponse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
  onDownload: (id: string) => void;
  onClose?: () => void;
  onUpdate?: (id: string, updates: Partial<ArtifactResponse>) => void | Promise<void>;
}

const TIPO_LABELS: Record<ArtifactContentType, string> = {
  document: "Documento",
  image: "Imagem",
  note: "Nota",
  sheet: "Planilha",
};

const TIPO_OPTIONS: { value: ArtifactContentType; label: string }[] = [
  { value: ArtifactContentTypes.Document, label: "Documento" },
  { value: ArtifactContentTypes.Image, label: "Imagem" },
  { value: ArtifactContentTypes.Sheet, label: "Planilha" },
];

const SHORT_LIMIT = 60;

function renderContent(raw: string): string {
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.85rem;font-weight:700;margin-top:6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:0.9rem;font-weight:700;margin-top:6px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1rem;font-weight:700;margin-top:6px">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1rem;list-style:disc">$1</li>')
    .replace(/\n/g, "<br />");
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function FindingRow({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}): ReactElement {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
        <span className="text-foreground text-sm">{label}</span>
      </div>
      <span className="font-medium text-foreground text-sm">{count}</span>
    </div>
  );
}

const FIELD_BORDER = "rounded-md px-3 py-2.5 border border-border";

export default function ArtifactExpandedContent({
  artifact,
  onDelete,
  onClose,
  onUpdate,
}: ArtifactExpandedContentProps): ReactElement {
  const isNote = artifact.contentType === ArtifactContentTypes.Note;

  const [descExpanded, setDescExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(artifact.name);
  const [editCategory, setEditCategory] = useState(artifact.category ?? "");
  const [editDesc, setEditDesc] = useState(artifact.description);
  const [editContentType, setEditContentType] = useState<ArtifactContentType>(
    artifact.contentType
  );
  const [editContent, setEditContent] = useState(
    isNote ? (artifact.content ?? "") : (artifact.driveLink ?? "")
  );

  const findings = artifact.findings ?? { high: 0, medium: 0, low: 0 };
  const isLong = artifact.description.length > SHORT_LIMIT;
  const visibleDesc =
    descExpanded || !isLong
      ? artifact.description
      : artifact.description.slice(0, SHORT_LIMIT) + "…";

  function handleSave(): void {
    void onUpdate?.(artifact.id, {
      name: editName,
      category: editCategory,
      description: editDesc,
      ...(isNote
        ? { content: editContent }
        : { driveLink: editContent, contentType: editContentType }),
    });
    setIsEditing(false);
  }

  function handleCancelEdit(): void {
    setEditName(artifact.name);
    setEditCategory(artifact.category ?? "");
    setEditDesc(artifact.description);
    setEditContentType(artifact.contentType);
    setEditContent(isNote ? (artifact.content ?? "") : (artifact.driveLink ?? ""));
    setIsEditing(false);
  }

  const inputClass =
    "bg-transparent outline-none text-sm text-foreground w-full mt-0.5 font-sans";
  const textareaClass =
    "bg-transparent outline-none text-sm text-foreground w-full mt-0.5 resize-none font-sans";
  const selectClass =
    "bg-card outline-none text-sm text-foreground mt-0.5 font-sans cursor-pointer border-none";

  return (
    <div className="flex gap-6">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              Visualizar artefato
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ative o lápis para editar inline os campos do artefato.
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              className={cn(
                "p-1 rounded transition-colors outline-none border-none bg-transparent cursor-pointer",
                isEditing
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={isEditing ? "Modo visualização" : "Editar"}
              onClick={() => setIsEditing((v) => !v)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none border-none bg-transparent cursor-pointer"
              title="Fechar"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className={cn(FIELD_BORDER, "flex-1")}>
            <span className="text-sm text-muted-foreground">Nome: </span>
            {isEditing ? (
              <input
                className={inputClass}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              <span className="text-sm text-foreground">{artifact.name}</span>
            )}
          </div>
          <div className={cn(FIELD_BORDER, "flex-none")}>
            <span className="text-sm text-muted-foreground">Tipo: </span>
            {isEditing && !isNote ? (
              <select
                className={selectClass}
                value={editContentType}
                onChange={(e) => setEditContentType(e.target.value as ArtifactContentType)}
              >
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-foreground">
                {TIPO_LABELS[artifact.contentType] ?? artifact.contentType}
              </span>
            )}
          </div>
        </div>

        <div className={FIELD_BORDER}>
          <span className="text-sm text-muted-foreground">Categoria: </span>
          {isEditing ? (
            <input
              className={inputClass}
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
          ) : (
            <span className="text-sm text-foreground">{artifact.category ?? "—"}</span>
          )}
        </div>

        <div className={FIELD_BORDER}>
          {isEditing ? (
            <>
              <span className="text-sm text-muted-foreground">Descrição: </span>
              <textarea
                className={textareaClass}
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1 text-sm">
                <span className="text-muted-foreground">Descrição: </span>
                <span className="text-foreground">{visibleDesc}</span>
              </div>
              {isLong && (
                <button
                  type="button"
                  className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors outline-none border-none bg-transparent cursor-pointer"
                  onClick={() => setDescExpanded((v) => !v)}
                  title={descExpanded ? "Ver menos" : "Ver mais"}
                >
                  {descExpanded
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />
                  }
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing && isNote ? (
          <div className={cn(FIELD_BORDER, "overflow-hidden !p-0")}>
            <div className="px-3 pt-2.5 pb-1">
              <span className="text-sm text-muted-foreground">Conteúdo</span>
            </div>
            <NoteEditor
              key={`note-editor-${artifact.id}`}
              content={editContent}
              onChange={setEditContent}
            />
          </div>
        ) : (
          <div className={FIELD_BORDER}>
            <span className="text-sm text-muted-foreground">Conteúdo: </span>
            {isEditing ? (
              <input
                className={inputClass}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            ) : isNote ? (
              <div
                className="text-sm text-foreground leading-relaxed mt-0.5"
                dangerouslySetInnerHTML={{
                  __html: renderContent(artifact.content ?? ""),
                }}
              />
            ) : (
              <a
                href={artifact.driveLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline hover:opacity-80 transition-opacity"
              >
                Abrir no Google Drive
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Última edição por{" "}
            <strong className="font-semibold text-foreground">
              {artifact.lastEditedBy ?? artifact.author}
            </strong>{" "}
            em {formatDate(artifact.lastEditedAt ?? artifact.createdAt)}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-transparent border border-border text-muted-foreground text-xs font-medium rounded-md hover:text-foreground outline-none cursor-pointer transition-colors"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 outline-none cursor-pointer border-none transition-opacity"
                onClick={handleSave}
              >
                Salvar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:opacity-90 outline-none cursor-pointer border-none transition-opacity"
              onClick={() => { void onDelete(artifact.id); }}
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="w-52 flex-shrink-0 border border-border rounded-lg p-4 flex flex-col gap-3 self-start">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Achados</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Criticidade dos achados ligados
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <FindingRow color="bg-red-500" label="Alto" count={findings.high} />
          <FindingRow color="bg-yellow-400" label="Médio" count={findings.medium} />
          <FindingRow color="bg-green-500" label="Baixo" count={findings.low} />
        </div>
      </div>
    </div>
  );
}
