package wsssguardo.archive.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import wsssguardo.archive.ArchiveManifest;
import wsssguardo.archive.domain.ArchiveStatus;

public record ArchiveManifestResponse(
        UUID id,
        UUID projectId,
        String fileName,
        String sha256,
        long sizeBytes,
        ArchiveStatus status,
        String createdBy,
        LocalDateTime createdAt,
        String confirmedBy,
        LocalDateTime confirmedAt
) {
    public static ArchiveManifestResponse from(ArchiveManifest m) {
        return new ArchiveManifestResponse(
                m.getId(), m.getProjectId(), m.getFileName(), m.getSha256(), m.getSizeBytes(),
                m.getStatus(), m.getCreatedBy(), m.getCreatedAt(), m.getConfirmedBy(), m.getConfirmedAt());
    }
}
