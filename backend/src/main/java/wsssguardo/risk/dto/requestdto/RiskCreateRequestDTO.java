package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RiskCreateRequestDTO(

    @NotNull(message = "projectId must not be null")
    UUID projectId,

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

    @Size(max = 255, message = "damageOperations must not exceed 255 characters")
    String damageOperations,

    @NotEmpty(message = "damageAssetIds must contain at least one element")
    List<UUID> damageAssetIds,

    @Size(max = 255, message = "damageIndividuals must not exceed 255 characters")
    String damageIndividuals,

    @Size(max = 255, message = "damageOtherOrgs must not exceed 255 characters")
    String damageOtherOrgs,

    @Size(max = 255, message = "recommendation must not exceed 255 characters")
    String recommendation,

    @Min(value = 0, message = "riskLevel must be greater than or equal to 0")
    @Max(value = 10000, message = "riskLevel must be less than or equal to 10000")
    Integer riskLevel
) {
}
