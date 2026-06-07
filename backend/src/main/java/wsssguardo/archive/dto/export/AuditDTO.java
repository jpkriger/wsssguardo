package wsssguardo.archive.dto.export;

import java.time.LocalDateTime;

/**
 * Bloco de auditoria do BaseEntity. {@code deletedAt != null} identifica um tombstone.
 */
public record AuditDTO(
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt,
        String createdBy,
        String lastModifiedBy,
        String deletedBy
) {
}
