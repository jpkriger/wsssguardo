package wsssguardo.entityobject.dto;

import java.time.Instant;

public record EntityObjectResponse(
    Long id,
    String name,
    Instant createdAt
) {
}
