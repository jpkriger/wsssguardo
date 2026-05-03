package wsssguardo.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record ProjectConfigurationDTO(
    @Valid
    @NotNull(message = "Configuração de risco é obrigatória")
    RiskConfigDTO riskConfig
) {

}
