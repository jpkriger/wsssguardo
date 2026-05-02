package wsssguardo.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record RiskCategoryDTO(
    @NotBlank(message = "Label não pode ser vazio")
    String name,
    Integer minValue,
    Integer maxValue
) {
} 
