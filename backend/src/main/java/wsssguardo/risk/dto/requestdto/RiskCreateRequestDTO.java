package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RiskCreateRequestDTO(
    @NotNull UUID projectId,
    @NotBlank String name,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    String damageOperations,
    List<UUID> findIds,
    List<UUID> assetIds,
    String damageIndividuals,
    String damageOtherOrgs,
    String recommendation,
    Integer riskLevel
) {}