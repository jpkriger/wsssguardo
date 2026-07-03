package wsssguardo.company.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;
import wsssguardo.company.dto.responsedto.CompanyWithProjectsDTO;
import wsssguardo.company.service.CompanyService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class CompanyControllerTest {

    @Mock
    private CompanyService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private CompanyController controller;

    @BeforeEach
    void setUp() {
        controller = new CompanyController(service, projectAccessService);
    }

    @Test
    void listShouldAssertManagerAndDelegate() {
        UUID id = UUID.randomUUID();
        when(service.listWithProjects()).thenReturn(List.of(new CompanyWithProjectsDTO(id, "n", LocalDateTime.now(), List.of())));

        ResponseEntity<List<CompanyWithProjectsDTO>> result = controller.list();

        assertEquals(1, result.getBody().size());
        verify(projectAccessService).assertManager();
    }

    @Test
    void createShouldReturnCreatedWithLocation() {
        UUID id = UUID.randomUUID();
        CompanyRequestDTO dto = new CompanyRequestDTO("Acme");
        when(service.create(dto)).thenReturn(new CompanyResponseDTO(id, "Acme", LocalDateTime.now()));

        ResponseEntity<CompanyResponseDTO> result = controller.create(dto);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/companies/" + id, result.getHeaders().getLocation().toString());
        verify(projectAccessService).assertManager();
    }

    @Test
    void updateShouldAssertManagerAndReturnOk() {
        UUID id = UUID.randomUUID();
        CompanyUpdateRequestDTO dto = new CompanyUpdateRequestDTO("New");
        when(service.update(id, dto)).thenReturn(new CompanyResponseDTO(id, "New", LocalDateTime.now()));

        ResponseEntity<CompanyResponseDTO> result = controller.update(id, dto);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertManager();
    }

    @Test
    void deleteShouldAssertManagerAndCallServiceWithUsername() {
        UUID id = UUID.randomUUID();
        when(projectAccessService.getUsername()).thenReturn("tester");

        ResponseEntity<Void> result = controller.delete(id);

        assertEquals(204, result.getStatusCode().value());
        verify(service).delete(id, "tester");
    }
}
