package wsssguardo.risk.dto.responsedto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RiskResponseDTO(
    UUID id,
    UUID projectId,
    String name,
    List<UUID> findIds,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    String damageOperations,
    String damageIndividuals,
    String damageOtherOrgs,
    String recommendation,
    Integer riskLevel,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
