package wsssguardo.risk.controller;

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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import wsssguardo.risk.RiskPriority;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskSummaryDTO;
import wsssguardo.risk.service.RiskService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class RiskControllerTest {

    @Mock
    private RiskService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private RiskController controller;

    @BeforeEach
    void setUp() {
        controller = new RiskController(service, projectAccessService);
    }

    private RiskResponseDTO dummy(UUID id) {
        return new RiskResponseDTO(id, UUID.randomUUID(), "n", List.of(), null, null,
                null, null, null, null, null, null, null, RiskPriority.P1, null, null, null, null, null);
    }

    @Test
    void findAllByProjectShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        RiskPageResponseDTO page = new RiskPageResponseDTO(List.of(dummy(UUID.randomUUID())), 0, 10, 1, 1, true, true);
        when(service.findAllByProject(projectId, pageable)).thenReturn(page);

        ResponseEntity<RiskPageResponseDTO> result = controller.findAllByProject(projectId, pageable);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void getRiskSummaryShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        when(service.getRiskSummary(projectId)).thenReturn(new RiskSummaryDTO(1, 0, 0, 1));

        ResponseEntity<RiskSummaryDTO> result = controller.getRiskSummary(projectId);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void createRiskShouldReturnCreatedWithLocation() {
        UUID projectId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        RiskCreateRequestDTO request = new RiskCreateRequestDTO("n", List.of(UUID.randomUUID()), null, null,
                null, null, 1f, 1f, 1f, 1f, null, RiskPriority.P1);
        when(service.createRisk(projectId, request)).thenReturn(dummy(riskId));

        ResponseEntity<RiskResponseDTO> result = controller.createRisk(projectId, request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/projects/" + projectId + "/risks/" + riskId, result.getHeaders().getLocation().toString());
    }

    @Test
    void updateShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(null, null, null, null, null, null, null, null, null, null, null, null);
        when(service.update(projectId, id, dto)).thenReturn(dummy(id));

        ResponseEntity<RiskResponseDTO> result = controller.update(projectId, id, dto);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void deleteShouldAssertAccessAndCallServiceWithUsername() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(projectAccessService.getUsername()).thenReturn("tester");

        ResponseEntity<Void> result = controller.delete(projectId, id);

        assertEquals(204, result.getStatusCode().value());
        verify(service).delete(projectId, id, "tester");
    }
}
