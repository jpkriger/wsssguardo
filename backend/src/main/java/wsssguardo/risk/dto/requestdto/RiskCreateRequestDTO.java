package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import wsssguardo.risk.RiskPriority;

public record RiskCreateRequestDTO(

    @NotBlank(message = "name must not be blank")
    @Size(max = 255, message = "name must not exceed 255 characters")
    String name,

    @NotEmpty(message = "findIds must contain at least one element")
    List<UUID> findIds,

    @Size(max = 255, message = "description must not exceed 255 characters")
    String description,

    @Size(max = 255, message = "consequences must not exceed 255 characters")
    String consequences,

    Float occurrenceProbability,

    Float impactProbability,

    @NotNull(message = "damageOperations must not be null")
    Float damageOperations,

    @NotNull(message = "damageIndividuals must not be null")
    Float damageIndividuals,

    @NotNull(message = "damageOtherOrgs must not be null")
    Float damageOtherOrgs,

    @NotNull(message = "damageAssets must not be null")
    Float damageAssets,

    @Size(max = 255, message = "recommendation must not exceed 255 characters")
    String recommendation,

    @NotNull(message = "priority must not be null")
    RiskPriority priority
) {
}
