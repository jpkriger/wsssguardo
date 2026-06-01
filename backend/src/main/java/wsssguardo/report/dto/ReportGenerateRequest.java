package wsssguardo.report.dto;

import java.util.List;
import java.util.Map;

public class ReportGenerateRequest {
    public String projectId;
    public List<String> selectedSections; // e.g. ["risks","findings"]
    public String detailLevel; // "summary" | "standard" | "detailed"
    public Map<String,String> editableFields; // optional overrides
}
