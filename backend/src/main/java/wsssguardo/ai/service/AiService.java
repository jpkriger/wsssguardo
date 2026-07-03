package wsssguardo.ai.service;

import java.util.List;
import java.util.UUID;

public interface AiService {
    Float suggestScore(UUID projectId, UUID riskId);
    String summarizeRisk(UUID projectId, UUID riskId);
    String summarizeReport(UUID projectId, List<String> summaries, String reportType);
}
