package wsssguardo.project.dto;

import java.time.LocalDate;

public record ProjectSummaryDTO(
    long assetCount,
    long artifactCount,
    long findingCount,
    long riskCount,
    long highRisks,
    long mediumRisks,
    long lowRisks,
    LocalDate deadlineDate,
    Integer daysRemaining
) {}
