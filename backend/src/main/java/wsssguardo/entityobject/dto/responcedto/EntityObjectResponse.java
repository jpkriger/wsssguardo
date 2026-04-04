package wsssguardo.entityobject.dto;

import java.time.Instant;
import java.util.UUID;

public record EntityObjectResponse(
    UUID id,
    String name,
    Instant createdAt
) {
}
