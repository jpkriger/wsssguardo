package wsssguardo.entityobject.dto.responsedto;

import java.time.Instant;
import java.util.UUID;

public record EntityObjectResponse(UUID id, String name, Instant createdAt) {}