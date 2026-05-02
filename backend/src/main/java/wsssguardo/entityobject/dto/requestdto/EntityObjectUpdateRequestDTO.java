package wsssguardo.entityobject.dto.requestdto;

import jakarta.validation.constraints.Size;

public record EntityObjectUpdateRequestDTO(
    @Size(max = 255, message = "name must be at most 255 characters")
    String name,

    String description,

    @Size(max = 255, message = "reference must be at most 255 characters")
    String reference
) {}