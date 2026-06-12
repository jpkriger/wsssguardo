package wsssguardo.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectDeletionAudit;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectDeletionAuditRepository;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.project.repository.ProjectUserRepository;
import wsssguardo.shared.security.ProjectAccessService;
import wsssguardo.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository repository;

    @Mock
    private ProjectUserRepository projectUserRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectAccessService projectAccessService;

    @Mock
    private ProjectDeletionAuditRepository projectDeletionAuditRepository;

    @Spy
    private ProjectMapper mapper = new ProjectMapper();

    @InjectMocks
    private ProjectService service;

    @Test
    void listAllProjectsShouldReturnMappedProjects() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        Project first = project(firstId, "Legacy", companyId, ProjectStatus.COMPLETED,
                LocalDateTime.of(2026, 1, 1, 0, 0));
        Project second = project(secondId, "Modern", companyId, ProjectStatus.IN_PROGRESS,
                LocalDateTime.of(2026, 2, 1, 0, 0));

        when(projectAccessService.getAccessibleProjectIds()).thenReturn(List.of(firstId, secondId));
        when(repository.findAllByIdIn(anyList())).thenReturn(List.of(first, second));

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
        UUID companyId = UUID.randomUUID();

        Project second = project(secondId, "Mobile App", companyId, ProjectStatus.IN_PROGRESS,
                LocalDateTime.now());
        Project first = project(firstId, "Alpha Platform", companyId, ProjectStatus.COMPLETED,
                LocalDateTime.now());

        when(projectAccessService.getAccessibleProjectIds()).thenReturn(List.of(firstId, secondId));
        when(repository.findAllById(List.of(secondId, firstId))).thenReturn(List.of(first, second));

        List<ProjectResponse> responses = service.projectsById(List.of(secondId, firstId));

        assertEquals(2, responses.size());
        assertEquals(secondId, responses.get(0).id());
        assertEquals("Mobile App", responses.get(0).name());
        assertEquals(companyId, responses.get(0).companyId());
        assertEquals(ProjectStatus.IN_PROGRESS, responses.get(0).status());
        assertEquals(firstId, responses.get(1).id());
    }

    @Test
    void projectsByIdShouldIgnoreUnknownIds() {
        UUID knownId = UUID.randomUUID();
        UUID unknownId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        Project known = project(knownId, "Known Project", companyId, ProjectStatus.ON_HOLD,
                LocalDateTime.now());

        when(projectAccessService.getAccessibleProjectIds()).thenReturn(List.of(knownId, unknownId));
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

        when(projectAccessService.getAccessibleProjectIds()).thenReturn(expected);
        when(repository.findProjectIdsByUserId(userId)).thenReturn(expected);

        List<UUID> actual = service.projectsByUserId(userId);

        assertEquals(expected, actual);
        verify(repository).findProjectIdsByUserId(userId);
    }

    @Test
    void projectsByUserIdShouldReturnEmptyListWhenNoProjectsAreFound() {
        UUID userId = UUID.randomUUID();

        when(projectAccessService.getAccessibleProjectIds()).thenReturn(List.of());
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

    @Test
    void deleteProjectShouldAuditAndHardDeleteProject() {
        UUID projectId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        String deletedBy = "manager@test.com";
        Project project = project(projectId, "Pentest Cliente X", companyId, ProjectStatus.IN_PROGRESS,
                LocalDateTime.of(2026, 2, 1, 10, 0));

        when(repository.findById(projectId)).thenReturn(Optional.of(project));

        service.deleteProject(projectId, deletedBy);

        ArgumentCaptor<ProjectDeletionAudit> auditCaptor = ArgumentCaptor.forClass(ProjectDeletionAudit.class);
        verify(projectDeletionAuditRepository).save(auditCaptor.capture());
        verify(repository).delete(project);

        ProjectDeletionAudit audit = auditCaptor.getValue();
        assertEquals("Pentest Cliente X", audit.getProjectName());
        assertEquals("Company", audit.getCompanyName());
        assertEquals(ProjectStatus.IN_PROGRESS, audit.getProjectStatus());
        assertEquals(LocalDate.of(2026, 3, 21), audit.getProjectStartDate());
        assertEquals(LocalDate.of(2026, 4, 21), audit.getProjectEndDate());
        assertEquals(deletedBy, audit.getDeletedBy());
        assertNotNull(audit.getDeletedAt());
    }

    private static Project project(UUID id, String name, UUID companyId, ProjectStatus status,
            LocalDateTime createdAt) {
        Company company = new Company();
        company.setId(companyId);
        company.setName("Company");
        company.setCreatedAt(LocalDateTime.now());

        Project project = new Project();
        project.setId(id);
        project.setName(name);
        project.setCompany(company);
        project.setStartDate(LocalDate.of(2026, 3, 21));
        project.setEndDate(LocalDate.of(2026, 4, 21));
        project.setStatus(status);
        project.setCreatedAt(createdAt);
        return project;
    }
}
