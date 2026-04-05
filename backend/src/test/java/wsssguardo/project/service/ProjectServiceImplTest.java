package wsssguardo.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.customer.Customer;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository repository;

    private ProjectService service;

    @BeforeEach
    void setUp() {
        service = new ProjectService(repository, new ProjectMapper());
    }

    @Test
    void projectsByIdShouldReturnProjectsInRequestedOrder() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();

        Project second = project(secondId, "Mobile App", customerId, ProjectStatus.IN_PROGRESS);
        Project first = project(firstId, "Alpha Platform", customerId, ProjectStatus.COMPLETED);

        when(repository.findAllById(List.of(secondId, firstId))).thenReturn(List.of(first, second));

        List<ProjectResponse> responses = service.projectsById(List.of(secondId, firstId));

        assertEquals(2, responses.size());
        assertEquals(secondId, responses.get(0).id());
        assertEquals("Mobile App", responses.get(0).name());
        assertEquals(customerId, responses.get(0).customerId());
        assertEquals(ProjectStatus.IN_PROGRESS, responses.get(0).status());
        assertEquals(firstId, responses.get(1).id());
    }

    @Test
    void projectsByIdShouldIgnoreUnknownIds() {
        UUID knownId = UUID.randomUUID();
        UUID unknownId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();

        Project known = project(knownId, "Known Project", customerId, ProjectStatus.ON_HOLD);

        when(repository.findAllById(List.of(unknownId, knownId))).thenReturn(List.of(known));

        List<ProjectResponse> responses = service.projectsById(List.of(unknownId, knownId));

        assertEquals(1, responses.size());
        assertEquals(knownId, responses.get(0).id());
    }

    @Test
    void projectsByIdShouldReturnEmptyListWhenIdsAreMissing() {
        assertTrue(service.projectsById(null).isEmpty());
        assertTrue(service.projectsById(List.of()).isEmpty());
    }

    private static Project project(UUID id, String name, UUID customerId, ProjectStatus status) {
        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setName("Customer");
        customer.setCreatedAt(LocalDateTime.now());

        Project project = new Project();
        project.setId(id);
        project.setName(name);
        project.setCustomer(customer);
        project.setStartDate(LocalDate.of(2026, 3, 21));
        project.setEndDate(LocalDate.of(2026, 4, 21));
        project.setStatus(status);
        project.setCreatedAt(LocalDateTime.now());
        return project;
    }
}