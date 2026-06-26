package wsssguardo.archive.dto.export;

import java.util.UUID;

public record ProjectUserExportDTO(
        UUID id,
        UUID userId,
        AuditDTO audit
) {
}
