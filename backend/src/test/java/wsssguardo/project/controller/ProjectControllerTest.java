package wsssguardo.project.controller;

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

import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.dto.ProjectCreateRequest;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.dto.ProjectSummaryDTO;
import wsssguardo.project.dto.ProjectUpdateRequest;
import wsssguardo.project.service.ProjectService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock
    private ProjectService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private ProjectController controller;

    @BeforeEach
    void setUp() {
        controller = new ProjectController(service, projectAccessService);
    }

    private ProjectResponse dummy(UUID id) {
        return new ProjectResponse(id, "n", UUID.randomUUID(), null, null, ProjectStatus.IN_PROGRESS, List.of(), null);
    }

    @Test
    void listAllProjectsShouldReturnOk() {
        when(service.listAllProjects()).thenReturn(List.of(dummy(UUID.randomUUID())));

        ResponseEntity<List<ProjectResponse>> result = controller.listAllProjects();

        assertEquals(1, result.getBody().size());
    }

    @Test
    void projectsByIdShouldDelegate() {
        UUID id = UUID.randomUUID();
        when(service.projectsById(List.of(id))).thenReturn(List.of(dummy(id)));

        List<ProjectResponse> result = controller.projectsById(List.of(id));

        assertEquals(1, result.size());
    }

    @Test
    void projectsByUserIdShouldReturnOk() {
        UUID userId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        when(service.projectsByUserId(userId)).thenReturn(List.of(projectId));

        ResponseEntity<List<UUID>> result = controller.projectsByUserId(userId);

        assertEquals(List.of(projectId), result.getBody());
    }

    @Test
    void getSummaryShouldAssertAccessAndDelegate() {
        UUID id = UUID.randomUUID();
        when(service.getSummary(id)).thenReturn(new ProjectSummaryDTO(1, 1, 1, 1, 0, 0, 1, null, null));

        ResponseEntity<ProjectSummaryDTO> result = controller.getSummary(id);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(id);
    }

    @Test
    void createProjectShouldAssertManagerAndReturnCreated() {
        UUID id = UUID.randomUUID();
        ProjectCreateRequest request = new ProjectCreateRequest("n", UUID.randomUUID(), null, null, null, null);
        when(service.createProject(request)).thenReturn(dummy(id));

        ResponseEntity<ProjectResponse> result = controller.createProject(request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/projects/" + id, result.getHeaders().getLocation().toString());
        verify(projectAccessService).assertManager();
    }

    @Test
    void updateProjectShouldAssertManagerAndReturnOk() {
        UUID id = UUID.randomUUID();
        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, null, null);
        when(service.updateProject(id, request)).thenReturn(dummy(id));

        ResponseEntity<ProjectResponse> result = controller.updateProject(id, request);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertManager();
    }

    @Test
    void deleteProjectShouldAssertManagerAndCallServiceWithUsername() {
        UUID id = UUID.randomUUID();
        when(projectAccessService.getUsername()).thenReturn("tester");

        ResponseEntity<Void> result = controller.deleteProject(id);

        assertEquals(204, result.getStatusCode().value());
        verify(service).deleteProject(id, "tester");
    }
}
