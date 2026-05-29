package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Size;

public record RiskUpdateRequestDTO(
    String name,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    String damageOperations,
    @Size(min = 1, message = "findIds must contain at least one element if provided")
    List<UUID> findIds,
    String damageIndividuals,
    String damageOtherOrgs,
    String recommendation,
    Integer riskLevel
) {}