package wsssguardo.project.dto;

import java.util.List;

import lombok.Builder;

@Builder
public record RiskConfigUpdateDTO(
    Integer minRange,
    Integer maxRange,
    List<RiskCategoryDTO> categories
) {
    
}
