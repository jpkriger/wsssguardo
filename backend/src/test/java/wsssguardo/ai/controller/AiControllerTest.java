package wsssguardo.ai.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import wsssguardo.ai.dto.request.AiReportSummaryRequestDTO;
import wsssguardo.ai.dto.response.AiReportSummaryResponseDTO;
import wsssguardo.ai.dto.response.AiRiskSummaryResponseDTO;
import wsssguardo.ai.dto.response.AiScoreSuggestionResponseDTO;
import wsssguardo.ai.service.AiService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @Mock
    private AiService aiService;

    @Mock
    private ProjectAccessService projectAccessService;

    private AiController controller;

    @BeforeEach
    void setUp() {
        controller = new AiController(aiService, projectAccessService);
    }

    @Test
    void suggestScoreShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        when(aiService.suggestScore(projectId, riskId)).thenReturn(7.5f);

        ResponseEntity<AiScoreSuggestionResponseDTO> result = controller.suggestScore(projectId, riskId);

        assertEquals(7.5f, result.getBody().score());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void summarizeRiskShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        when(aiService.summarizeRisk(projectId, riskId)).thenReturn("resumo");

        ResponseEntity<AiRiskSummaryResponseDTO> result = controller.summarizeRisk(projectId, riskId);

        assertEquals("resumo", result.getBody().summary());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void reportSummaryShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        AiReportSummaryRequestDTO request = new AiReportSummaryRequestDTO(List.of("a"), "executivo");
        when(aiService.summarizeReport(projectId, List.of("a"), "executivo")).thenReturn("intro");

        ResponseEntity<AiReportSummaryResponseDTO> result = controller.reportSummary(projectId, request);

        assertEquals("intro", result.getBody().reportSummary());
        verify(projectAccessService).assertAccess(projectId);
    }
}
