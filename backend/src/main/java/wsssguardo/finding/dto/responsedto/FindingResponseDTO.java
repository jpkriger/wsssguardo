package wsssguardo.finding.dto.responsedto;

import wsssguardo.finding.domain.FindingSeverity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FindingResponseDTO(
        UUID id,
        String name,
        String description,
        Integer numericSeverity,
        FindingSeverity categoricalSeverity,
        String category,
        String reference,
        UUID projectId,
        List<UUID> linkedAssetIds,
        List<UUID> linkedArtifactIds,
        String createdBy,
        String lastModifiedBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
