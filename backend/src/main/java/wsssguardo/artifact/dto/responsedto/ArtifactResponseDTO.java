package wsssguardo.artifact.dto.responsedto;

import java.time.LocalDateTime;
import java.util.UUID;

import wsssguardo.artifact.domain.ArtifactType;

public record ArtifactResponseDTO(
    UUID id,
    String name,
    String description,
    String content,
    String category,
    String driveLink,
    String llmSummary,
    ArtifactType type,
    UUID projectId,
    String createdBy,
    String lastModifiedBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    FindingsSummary findingsSummary,
    RisksSummary risksSummary
) {

    public record FindingsSummary(int high, int medium, int low) {}

    public record RisksSummary(int high, int medium, int low) {}

}
