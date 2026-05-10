package wsssguardo.risk.dto.responsedto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RiskResponseDTO(
    UUID id,
    String name,
    UUID projectId,
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
    Integer riskLevel,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}