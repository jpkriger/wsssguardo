package wsssguardo.risk.dto.responsedto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import wsssguardo.risk.RiskPriority;

public record RiskResponseDTO(
    UUID id,
    UUID projectId,
    String name,
    List<UUID> findIds,
    String description,
    String consequences,
    Float occurrenceProbability,
    Float impactProbability,
    Float damageOperations,
    Float damageIndividuals,
    Float damageOtherOrgs,
    Float damageAssets,
    Float generalRisk,
    RiskPriority priority,
    String aiSummary,
    String recommendation,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
