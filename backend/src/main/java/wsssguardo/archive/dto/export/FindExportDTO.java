package wsssguardo.archive.dto.export;

import java.util.List;
import java.util.UUID;

public record FindExportDTO(
        UUID id,
        String name,
        String description,
        String sector,
        Integer quantitativeCriticality,
        Integer numericSeverity,
        String categoricalSeverity,
        String category,
        String threatEvent,
        String reference,
        String recommendation,
        List<UUID> assetIds,
        List<UUID> artifactIds,
        List<UUID> categoryIds,
        AuditDTO audit
) {
}
