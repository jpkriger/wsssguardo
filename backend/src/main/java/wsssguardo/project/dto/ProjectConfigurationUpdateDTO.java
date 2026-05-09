package wsssguardo.project.dto;

import lombok.Builder;

@Builder
public record ProjectConfigurationUpdateDTO(
    RiskConfigUpdateDTO riskConfig
) {
    
}
