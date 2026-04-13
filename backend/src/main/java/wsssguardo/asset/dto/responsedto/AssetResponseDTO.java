package wsssguardo.asset.dto.responsedto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AssetResponseDTO(
        UUID id,
        String name,
        String description,
        String content,
        UUID projectId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
