package wsssguardo.risk.dto.responsedto;

public record RiskSummaryDTO(
    long total,
    long highRisks,
    long mediumRisks,
    long lowRisks
) {}
