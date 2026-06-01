package wsssguardo.report.renderer;

import org.springframework.stereotype.Component;
import wsssguardo.report.dto.ReportGenerateRequest;
import wsssguardo.report.dto.ReportProjectData;

@Component
public class ReportHtmlComposer {
    public String compose(ReportGenerateRequest request, ReportProjectData data) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html><html><head><meta charset=\"utf-8\"><title>Report</title></head><body>");
        sb.append("<h1>Project " + request.projectId + "</h1>");

        String level = request.detailLevel == null ? "standard" : request.detailLevel.toLowerCase();

        // Findings
        if (request.selectedSections != null && request.selectedSections.contains("findings")) {
            sb.append("<section><h2>findings</h2>");
            if (data != null && data.findings != null && !data.findings.isEmpty()) {
                for (var f : data.findings) {
                    if ("summary".equals(level)) {
                        sb.append("<div><strong>" + f.id() + "</strong> - " + f.name() + "</div>");
                    } else {
                        sb.append("<div><h3>" + f.name() + "</h3><p>" + (f.description() != null ? f.description() : "") + "</p></div>");
                    }
                }
            } else {
                sb.append("<p>No findings for this project.</p>");
            }
            sb.append("</section>");
        }

        // Assets
        if (request.selectedSections != null && request.selectedSections.contains("assets")) {
            sb.append("<section><h2>assets</h2>");
            if (data != null && data.assets != null && !data.assets.isEmpty()) {
                for (var a : data.assets) {
                    if ("summary".equals(level)) {
                        sb.append("<div>" + a.id() + " - " + a.name() + "</div>");
                    } else {
                        sb.append("<div><h3>" + a.name() + "</h3><p>" + (a.description() != null ? a.description() : "") + "</p></div>");
                    }
                }
            } else {
                sb.append("<p>No assets for this project.</p>");
            }
            sb.append("</section>");
        }

        // Artifacts
        if (request.selectedSections != null && request.selectedSections.contains("artifacts")) {
            sb.append("<section><h2>artifacts</h2>");
            if (data != null && data.artifacts != null && !data.artifacts.isEmpty()) {
                for (var ar : data.artifacts) {
                    if ("summary".equals(level)) {
                        sb.append("<div>" + ar.id() + " - " + ar.name() + "</div>");
                    } else {
                        sb.append("<div><h3>" + ar.name() + "</h3><p>" + (ar.description() != null ? ar.description() : "") + "</p></div>");
                    }
                }
            } else {
                sb.append("<p>No artifacts for this project.</p>");
            }
            sb.append("</section>");
        }

        // Risks
        if (request.selectedSections != null && request.selectedSections.contains("risks")) {
            sb.append("<section><h2>risks</h2>");
            if (data != null && data.risksPage != null && data.risksPage.content() != null && !data.risksPage.content().isEmpty()) {
                for (var r : data.risksPage.content()) {
                    if ("summary".equals(level)) {
                        sb.append("<div>" + r.id() + " - " + r.name() + " (level: " + r.riskLevel() + ")</div>");
                    } else {
                        sb.append("<div><h3>" + r.name() + "</h3><p>Risk level: " + r.riskLevel() + "</p><p>" + (r.description() != null ? r.description() : "") + "</p></div>");
                    }
                }
            } else {
                sb.append("<p>No risks for this project.</p>");
            }
            sb.append("</section>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }
}
