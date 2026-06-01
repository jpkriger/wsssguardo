package wsssguardo.report.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public class ReportGenerateResponse {
    public String reportId;
    public String projectId;
    public String status; // "generated" | "html-only" | "failed"
    public OffsetDateTime generatedAt;
    public Map<String,ReportArtifact> artifacts; // keys: "pdf", "html"
}
