package wsssguardo.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import wsssguardo.customer.Customer;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository repository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private ProjectMapper mapper = new ProjectMapper();

    @InjectMocks
    private ProjectService service;

    @Test
    void listAllProjectsShouldReturnMappedProjects() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();

        Project first = project(firstId, "Legacy", customerId, ProjectStatus.COMPLETED);
        Project second = project(secondId, "Modern", customerId, ProjectStatus.IN_PROGRESS);

        when(repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))).thenReturn(List.of(second, first));

        List<ProjectResponse> responses = service.listAllProjects();

        assertEquals(2, responses.size());
        assertEquals(secondId, responses.get(0).id());
        assertEquals("Modern", responses.get(0).name());
        assertEquals(firstId, responses.get(1).id());
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

    @Test
    void projectsByUserIdShouldReturnProjectIds() {
        UUID userId = UUID.randomUUID();
        List<UUID> expected = List.of(UUID.randomUUID(), UUID.randomUUID());

        when(repository.findProjectIdsByUserId(userId)).thenReturn(expected);

        List<UUID> actual = service.projectsByUserId(userId);

        assertEquals(expected, actual);
        verify(repository).findProjectIdsByUserId(userId);
    }

    @Test
    void projectsByUserIdShouldReturnEmptyListWhenNoProjectsAreFound() {
        UUID userId = UUID.randomUUID();

        when(repository.findProjectIdsByUserId(userId)).thenReturn(List.of());

        List<UUID> actual = service.projectsByUserId(userId);

        assertTrue(actual.isEmpty());
        verify(repository).findProjectIdsByUserId(userId);
    }

    @Test
    void projectsByUserIdShouldReturnEmptyListWhenUserIdIsNull() {
        List<UUID> actual = service.projectsByUserId(null);

        assertTrue(actual.isEmpty());
        verifyNoInteractions(repository);
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
