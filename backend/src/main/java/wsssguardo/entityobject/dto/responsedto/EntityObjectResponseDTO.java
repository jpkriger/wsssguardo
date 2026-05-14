package wsssguardo.entityobject.dto.responsedto;

import java.time.Instant;
import java.util.UUID;

public record EntityObjectResponseDTO(
        UUID id,
        String name,
        String description,
        String reference,
        Instant createdAt
) {}
