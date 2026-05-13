package wsssguardo.project.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record RiskConfigDTO(
    @NotNull(message = "Range mínimo obrigatório")
    Integer minRange,
    @NotNull(message = "Range máximo obrigatório")
    Integer maxRange,
    @NotEmpty(message = "Pelo menos uma categoria de risco deve ser fornecida")
    @Valid
    List<RiskCategoryDTO> categories
) {
}
