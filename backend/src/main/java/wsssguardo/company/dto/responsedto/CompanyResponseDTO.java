package wsssguardo.company.dto.responsedto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CompanyResponseDTO(
    UUID id,
    String name,
    LocalDateTime createdAt
) {

}
