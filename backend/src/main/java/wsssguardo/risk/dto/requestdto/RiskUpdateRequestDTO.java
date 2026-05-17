package wsssguardo.risk.dto.requestdto;

import java.util.List;
import java.util.UUID;

public record RiskUpdateRequestDTO(
    String name,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    String damageOperations,
    List<UUID> findIds,
    String damageIndividuals,
    String damageOtherOrgs,
    String recommendation,
    Integer riskLevel
) {}