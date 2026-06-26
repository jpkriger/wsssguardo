package wsssguardo.archive.dto.export;

import java.util.List;
import java.util.UUID;

public record RiskExportDTO(
        UUID id,
        String name,
        String description,
        String consequences,
        Float occurrenceProbability,
        Float impactProbability,
        Float damageOperations,
        Float damageIndividuals,
        Float damageOtherOrgs,
        Float damageAssets,
        Float generalRisk,
        String priority,
        String aiSummary,
        String recommendation,
        // Dono único da relação M2M risks_finds (não repetida no lado Find).
        List<UUID> findIds,
        AuditDTO audit
) {
}
