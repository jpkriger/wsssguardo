package wsssguardo.company.dto.requestdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyUpdateRequestDTO(
    @NotBlank(message = "name must not be blank when provided")
    @Size(max = 255, message = "name must be at most 255 characters")
    String name
) {
    
}
