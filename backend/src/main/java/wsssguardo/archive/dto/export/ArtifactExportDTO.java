package wsssguardo.archive.dto.export;

import java.util.UUID;

public record ArtifactExportDTO(
        UUID id,
        String name,
        String description,
        String content,
        String category,
        String driveLink,
        String llmSummary,
        String type,
        AuditDTO audit
) {
}
