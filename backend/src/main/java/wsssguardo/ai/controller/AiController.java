package wsssguardo.ai.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.ai.dto.request.AiReportSummaryRequestDTO;
import wsssguardo.ai.dto.response.AiReportSummaryResponseDTO;
import wsssguardo.ai.dto.response.AiRiskSummaryResponseDTO;
import wsssguardo.ai.dto.response.AiScoreSuggestionResponseDTO;
import wsssguardo.ai.service.AiService;
import wsssguardo.shared.security.ProjectAccessService;

@Tag(name = "AI", description = "AI-assisted risk analysis operations")
@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final ProjectAccessService projectAccessService;

    @Operation(summary = "Sugerir nota de risco via IA")
    @PostMapping("/api/projects/{projectId}/risks/{riskId}/ai/suggest-score")
    public ResponseEntity<AiScoreSuggestionResponseDTO> suggestScore(
            @PathVariable UUID projectId,
            @PathVariable UUID riskId) {
        projectAccessService.assertAccess(projectId);
        Float score = aiService.suggestScore(projectId, riskId);
        return ResponseEntity.ok(new AiScoreSuggestionResponseDTO(score));
    }

    @Operation(summary = "Gerar resumo executivo do risco via IA")
    @PostMapping("/api/projects/{projectId}/risks/{riskId}/ai/summarize")
    public ResponseEntity<AiRiskSummaryResponseDTO> summarizeRisk(
            @PathVariable UUID projectId,
            @PathVariable UUID riskId) {
        projectAccessService.assertAccess(projectId);
        String summary = aiService.summarizeRisk(projectId, riskId);
        return ResponseEntity.ok(new AiRiskSummaryResponseDTO(summary));
    }

    @Operation(summary = "Gerar introdução do relatório via IA")
    @PostMapping("/api/projects/{projectId}/ai/report-summary")
    public ResponseEntity<AiReportSummaryResponseDTO> reportSummary(
            @PathVariable UUID projectId,
            @Valid @RequestBody AiReportSummaryRequestDTO request) {
        projectAccessService.assertAccess(projectId);
        String reportSummary = aiService.summarizeReport(projectId, request.summaries(), request.reportType());
        return ResponseEntity.ok(new AiReportSummaryResponseDTO(reportSummary));
    }
}
