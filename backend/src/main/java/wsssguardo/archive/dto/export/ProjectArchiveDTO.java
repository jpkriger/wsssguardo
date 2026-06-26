package wsssguardo.archive.dto.export;

import java.time.Instant;
import java.util.List;

/**
 * Raiz do dump normalizado de um projeto. Cada entidade aparece exatamente uma vez
 * na sua lista; relacionamentos são representados por id. Listas ordenadas por id
 * para serialização determinística (necessário para hash/assinatura reproduzíveis).
 */
public record ProjectArchiveDTO(
        int schemaVersion,
        Instant exportedAt,
        boolean includesTombstones,
        ProjectNodeDTO project,
        List<AssetExportDTO> assets,
        List<ArtifactExportDTO> artifacts,
        List<FindExportDTO> finds,
        List<RiskExportDTO> risks,
        List<ProjectUserExportDTO> projectUsers,
        ReferencesDTO references
) {
    public static final int CURRENT_SCHEMA_VERSION = 1;
}
