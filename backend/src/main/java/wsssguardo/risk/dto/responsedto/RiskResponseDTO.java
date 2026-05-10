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
    List<UUID> damageAssetIds,
    String damageIndividuals,
    String damageOtherOrgs,
    String recommendation,
    RiskLevelDTO riskLevel,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
