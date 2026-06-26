package wsssguardo.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.ai.client.OllamaClient;
import wsssguardo.ai.service.impl.AiServiceImpl;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

    @Mock
    private RiskRepository riskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OllamaClient ollamaClient;

    @InjectMocks
    private AiServiceImpl service;

    @Test
    void suggestScoreShouldReturnParsedFloat() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();

        when(riskRepository.findByIdAndProjectId(riskId, projectId)).thenReturn(Optional.of(riskWithNoFinds(projectId)));
        when(ollamaClient.generate(anyString(), anyString(), anyDouble())).thenReturn("7.5");

        Float result = service.suggestScore(projectId, riskId);

        assertEquals(7.5f, result);
        verifyNoInteractions(projectRepository);
    }

    @Test
    void suggestScoreShouldClampAbove10() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();

        when(riskRepository.findByIdAndProjectId(riskId, projectId)).thenReturn(Optional.of(riskWithNoFinds(projectId)));
        when(ollamaClient.generate(anyString(), anyString(), anyDouble())).thenReturn("15");

        Float result = service.suggestScore(projectId, riskId);

        assertEquals(10f, result);
    }

    @Test
    void suggestScoreShouldThrowWhenRiskNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();

        when(riskRepository.findByIdAndProjectId(riskId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.suggestScore(projectId, riskId));
        verifyNoInteractions(projectRepository, ollamaClient);
    }

    @Test
    void summarizeRiskShouldReturnAiText() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        String expectedSummary = "Vulnerabilidade detectada no ambiente.";

        when(riskRepository.findByIdAndProjectId(riskId, projectId))
                .thenReturn(Optional.of(riskWithNoFinds(projectId)));
        when(ollamaClient.generate(anyString(), anyString(), anyDouble())).thenReturn(expectedSummary);

        String result = service.summarizeRisk(projectId, riskId);

        assertEquals(expectedSummary, result);
        verifyNoInteractions(projectRepository);
    }

    @Test
    void summarizeRiskShouldThrowWhenRiskNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();

        when(riskRepository.findByIdAndProjectId(riskId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.summarizeRisk(projectId, riskId));
        verifyNoInteractions(ollamaClient);
    }

    @Test
    void summarizeReportShouldReturnAiText() {
        UUID projectId = UUID.randomUUID();
        List<String> summaries = List.of("Risco A detectado.", "Risco B crítico.");
        String expectedReport = "A organização enfrenta exposição sistêmica.";
        Project project = new Project();
        project.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(ollamaClient.generate(anyString(), anyString(), anyDouble())).thenReturn(expectedReport);

        String result = service.summarizeReport(projectId, summaries, "executivo");

        assertEquals(expectedReport, result);
        verify(ollamaClient).generate(anyString(), anyString(), anyDouble());
    }

    @Test
    void summarizeReportShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.summarizeReport(projectId, List.of("summary"), "tecnico"));
        verifyNoInteractions(ollamaClient);
    }

    private Risk riskWithNoFinds(UUID projectId) {
        Project project = new Project();
        project.setId(projectId);
        Risk risk = new Risk();
        risk.setId(UUID.randomUUID());
        risk.setName("Test Risk");
        risk.setProject(project);
        risk.setFinds(new ArrayList<>());
        return risk;
    }
}
