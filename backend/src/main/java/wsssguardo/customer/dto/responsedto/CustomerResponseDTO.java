package wsssguardo.customer.dto.responsedto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CustomerResponseDTO(
    UUID id,
    String name,
    LocalDateTime createdAt
) {

}
