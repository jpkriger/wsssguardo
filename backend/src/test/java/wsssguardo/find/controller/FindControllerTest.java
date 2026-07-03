package wsssguardo.find.controller;

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

import wsssguardo.find.dto.requestdto.FindRequestDTO;
import wsssguardo.find.dto.requestdto.FindUpdateRequestDTO;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.find.service.FindService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class FindControllerTest {

    @Mock
    private FindService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private FindController controller;

    @BeforeEach
    void setUp() {
        controller = new FindController(service, projectAccessService);
    }

    private FindResponseDTO dummy(UUID id) {
        return new FindResponseDTO(id, "n", null, null, null, null, null,
                UUID.randomUUID(), List.of(), List.of(), null, null, null, null);
    }

    @Test
    void getFindingNameByProjectIdShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        when(service.getFindingNameByProjectId(projectId)).thenReturn(List.of(new FindNameResponseDTO(UUID.randomUUID(), "n")));

        ResponseEntity<List<FindNameResponseDTO>> result = controller.getFindingNameByProjectId(projectId);

        assertEquals(1, result.getBody().size());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void listByProjectShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        when(service.listByProject(projectId)).thenReturn(List.of(dummy(UUID.randomUUID())));

        List<FindResponseDTO> result = controller.listByProject(projectId);

        assertEquals(1, result.size());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void createShouldReturnCreatedWithLocation() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        FindRequestDTO request = new FindRequestDTO("n", null, null, null, null, null, List.of(), List.of());
        when(service.create(projectId, request)).thenReturn(dummy(findId));

        ResponseEntity<FindResponseDTO> result = controller.create(projectId, request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/projects/" + projectId + "/findings/" + findId, result.getHeaders().getLocation().toString());
    }

    @Test
    void getByIdShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(service.getById(projectId, id)).thenReturn(dummy(id));

        ResponseEntity<FindResponseDTO> result = controller.getById(projectId, id);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void updateShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        FindUpdateRequestDTO request = new FindUpdateRequestDTO(null, null, null, null, null, null, null, null);
        when(service.update(projectId, id, request)).thenReturn(dummy(id));

        ResponseEntity<FindResponseDTO> result = controller.update(projectId, id, request);

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
