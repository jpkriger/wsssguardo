package wsssguardo.artifact.controller;

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

import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.requestdto.ArtifactUpdateRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.service.ArtifactService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class ArtifactControllerTest {

    @Mock
    private ArtifactService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private ArtifactController controller;

    @BeforeEach
    void setUp() {
        controller = new ArtifactController(service, projectAccessService);
    }

    private ArtifactResponseDTO dummyResponse(UUID id) {
        return new ArtifactResponseDTO(id, "name", null, null, null, null, null,
                ArtifactType.NOTE, UUID.randomUUID(), null, null, null, null,
                new ArtifactResponseDTO.FindingsSummary(0, 0, 0),
                new ArtifactResponseDTO.RisksSummary(0, 0, 0));
    }

    @Test
    void listByProjectShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        when(service.listByProject(projectId, null)).thenReturn(List.of(dummyResponse(UUID.randomUUID())));

        List<ArtifactResponseDTO> result = controller.listByProject(projectId, null);

        assertEquals(1, result.size());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void createShouldReturnCreatedWithLocation() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        ArtifactRequestDTO request = new ArtifactRequestDTO("N", null, null, null, null, ArtifactType.NOTE);
        when(service.create(projectId, request)).thenReturn(dummyResponse(artifactId));

        ResponseEntity<ArtifactResponseDTO> result = controller.create(projectId, request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/projects/" + projectId + "/artifacts/" + artifactId,
                result.getHeaders().getLocation().toString());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void getByIdShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        when(service.getById(projectId, artifactId)).thenReturn(dummyResponse(artifactId));

        ResponseEntity<ArtifactResponseDTO> result = controller.getById(projectId, artifactId);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void updateShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        ArtifactUpdateRequestDTO request = new ArtifactUpdateRequestDTO(null, null, null, null, null, null);
        when(service.update(projectId, artifactId, request)).thenReturn(dummyResponse(artifactId));

        ResponseEntity<ArtifactResponseDTO> result = controller.update(projectId, artifactId, request);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void deleteShouldAssertAccessAndCallServiceWithUsername() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        when(projectAccessService.getUsername()).thenReturn("tester");

        ResponseEntity<Void> result = controller.delete(projectId, artifactId);

        assertEquals(204, result.getStatusCode().value());
        verify(service).delete(projectId, artifactId, "tester");
        verify(projectAccessService).assertAccess(projectId);
    }
}
