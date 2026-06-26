package wsssguardo.archive.dto.export;

import java.util.UUID;

public record AssetExportDTO(
        UUID id,
        String name,
        String description,
        String content,
        AuditDTO audit
) {
}
