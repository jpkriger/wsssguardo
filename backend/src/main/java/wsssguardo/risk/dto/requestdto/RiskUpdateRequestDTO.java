package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Size;
import wsssguardo.risk.RiskPriority;

public record RiskUpdateRequestDTO(
    String name,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    Float damageOperations,
    @Size(min = 1, message = "findIds must contain at least one element if provided")
    List<UUID> findIds,
    Float damageIndividuals,
    Float damageOtherOrgs,
    Float damageAssets,
    String recommendation,
    RiskPriority priority
) {}
