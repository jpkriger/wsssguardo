package wsssguardo.find.dto.responsedto;

import wsssguardo.find.domain.FindSeverity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FindResponseDTO(
        UUID id,
        String name,
        String description,
        Integer numericSeverity,
        FindSeverity categoricalSeverity,
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
