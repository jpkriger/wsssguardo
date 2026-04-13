import { type ReactElement } from "react";
import { ChevronDown, ChevronUp, File, FileText, Image } from "lucide-react";
import {
  ArtifactContentTypes,
  type ArtifactContentType,
  type ArtifactResponse,
} from "../../api/artifact";
import ArtifactExpandedContent from "../ArtifactExpandedContent/ArtifactExpandedContent";
import { cn } from "../../lib/utils";

const BADGE_LABELS: Record<ArtifactContentType, string> = {
  [ArtifactContentTypes.Document]: "DOC",
  [ArtifactContentTypes.Image]: "IMG",
  [ArtifactContentTypes.Note]: "NOTA",
  [ArtifactContentTypes.Sheet]: "PLANILHA",
};

function BadgeIcon({ contentType }: { contentType: ArtifactContentType }): ReactElement {
  if (contentType === ArtifactContentTypes.Document) return <File className="h-4 w-4" />;
  if (contentType === ArtifactContentTypes.Image) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

interface ArtifactRowProps {
  artifact: ArtifactResponse;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  findingsCount?: number;
  onUpdate?: (id: string, updates: Partial<ArtifactResponse>) => void;
}

export default function ArtifactRow({
  artifact,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onDownload,
  findingsCount: findingsCountProp,
  onUpdate,
}: ArtifactRowProps): ReactElement {
  const f = artifact.findings;
  const findingsCount = f ? f.high + f.medium + f.low : (findingsCountProp ?? 0);

  return (
    <>
      <tr
        className={cn(
          "transition-colors border-t-2 border-border",
          isExpanded ? "bg-accent/10" : "hover:bg-accent/20"
        )}
      >
        <td className="px-5 py-2.5 text-foreground text-lg font-normal align-middle">
          <div className="flex items-center gap-6">
            <button
              className="text-foreground hover:opacity-70 transition-opacity outline-none border-none bg-transparent cursor-pointer flex-shrink-0"
              onClick={() => onToggleExpand(artifact.id)}
              title={isExpanded ? "Recolher" : "Expandir"}
            >
              {isExpanded
                ? <ChevronUp className="h-6 w-6" />
                : <ChevronDown className="h-6 w-6" />
              }
            </button>
            <span>{artifact.name}</span>
          </div>
        </td>

        <td className="px-5 py-2.5 align-middle">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-foreground bg-secondary">
            <BadgeIcon contentType={artifact.contentType} />
            {artifact.fileLabel ?? BADGE_LABELS[artifact.contentType]}
          </span>
        </td>

        <td className="px-5 py-2.5 align-middle max-w-xs">
          <span className="block truncate text-lg font-normal text-foreground">
            {artifact.description}
          </span>
        </td>

        <td className="px-5 py-2.5 align-middle text-center">
          <span className="text-lg font-normal text-foreground">{findingsCount}</span>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-t-2 border-border">
          <td colSpan={4} className="px-8 py-6 bg-background">
            <ArtifactExpandedContent
              artifact={artifact}
              onEdit={onEdit}
              onDelete={onDelete}
              onDownload={onDownload}
              onClose={() => onToggleExpand(artifact.id)}
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  );
}
