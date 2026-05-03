package wsssguardo.customer.dto.responsedto;

import java.util.UUID;

public record CustomerResponseDTO(
    UUID id,
    String name
) {
    
}
