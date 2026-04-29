package wsssguardo.customer.dto.requestdto;

import jakarta.validation.constraints.Size;

public record CustomerUpdateRequestDTO(
    @Size(max = 255, message = "name must be at most 255 characters")
    String name
) {
    
}
