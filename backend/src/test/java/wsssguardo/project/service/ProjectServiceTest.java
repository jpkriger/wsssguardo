package wsssguardo.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectDeletionAudit;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.dto.ProjectCreateRequest;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.dto.ProjectSummaryDTO;
import wsssguardo.project.dto.ProjectUpdateRequest;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigUpdateDTO;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectDeletionAuditRepository;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.project.repository.ProjectUserRepository;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.shared.security.ProjectAccessService;
import wsssguardo.user.User;
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
    private AssetRepository assetRepository;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private FindRepository findRepository;

    @Mock
    private RiskRepository riskRepository;

    @Mock
    private ProjectAccessService projectAccessService;

    @Mock
    private ProjectDeletionAuditRepository projectDeletionAuditRepository;

    @Spy
    private ProjectMapper mapper = new ProjectMapper();

    @InjectMocks
    private ProjectService service;

    private RiskConfigUpdateDTO validRiskConfig() {
        return RiskConfigUpdateDTO.builder()
                .minRange(0)
                .maxRange(10)
                .categories(List.of(
                        RiskCategoryDTO.builder().label("Baixo").minRange(0).maxRange(3).build(),
                        RiskCategoryDTO.builder().label("Alto").minRange(4).maxRange(10).build()))
                .build();
    }

    @Test
    void createProjectShouldPersistProjectWithConfiguration() {
        UUID companyId = UUID.randomUUID();
        Company company = new Company();
        company.setId(companyId);
        company.setName("Acme");
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(repository.save(org.mockito.ArgumentMatchers.any(Project.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ProjectCreateRequest request = new ProjectCreateRequest(
                " Novo Projeto ", companyId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 1),
                null, validRiskConfig());

        ProjectResponse response = service.createProject(request);

        assertEquals("Novo Projeto", response.name());
        assertEquals(ProjectStatus.IN_PROGRESS, response.status());
    }

    @Test
    void createProjectShouldThrowWhenCompanyNotFound() {
        UUID companyId = UUID.randomUUID();
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", companyId, null, null, null, validRiskConfig());

        assertThrows(ResourceNotFoundException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenEndDateBeforeStartDate() {
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), LocalDate.of(2026, 6, 1), LocalDate.of(2026, 1, 1),
                null, validRiskConfig());

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenRiskConfigIsNull() {
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, null);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenRiskConfigRangeIsInvalid() {
        RiskConfigUpdateDTO invalid = RiskConfigUpdateDTO.builder()
                .minRange(10).maxRange(5)
                .categories(List.of(RiskCategoryDTO.builder().label("X").minRange(0).maxRange(1).build()))
                .build();
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, invalid);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenCategoriesEmpty() {
        RiskConfigUpdateDTO invalid = RiskConfigUpdateDTO.builder()
                .minRange(0).maxRange(10)
                .categories(List.of())
                .build();
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, invalid);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenCategoryLabelBlank() {
        RiskConfigUpdateDTO invalid = RiskConfigUpdateDTO.builder()
                .minRange(0).maxRange(10)
                .categories(List.of(RiskCategoryDTO.builder().label(" ").minRange(0).maxRange(5).build()))
                .build();
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, invalid);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenCategoryRangeInvalid() {
        RiskConfigUpdateDTO invalid = RiskConfigUpdateDTO.builder()
                .minRange(0).maxRange(10)
                .categories(List.of(RiskCategoryDTO.builder().label("X").minRange(5).maxRange(2).build()))
                .build();
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, invalid);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenCategoryOutsideProjectRange() {
        RiskConfigUpdateDTO invalid = RiskConfigUpdateDTO.builder()
                .minRange(0).maxRange(10)
                .categories(List.of(RiskCategoryDTO.builder().label("X").minRange(0).maxRange(20).build()))
                .build();
        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", UUID.randomUUID(), null, null, null, invalid);

        assertThrows(ApiException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldThrowWhenConsultantNotFound() {
        UUID companyId = UUID.randomUUID();
        UUID consultantId = UUID.randomUUID();
        Company company = new Company();
        company.setId(companyId);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findAllById(List.of(consultantId))).thenReturn(List.of());

        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", companyId, null, null, List.of(consultantId), validRiskConfig());

        assertThrows(ResourceNotFoundException.class, () -> service.createProject(request));
    }

    @Test
    void createProjectShouldAttachConsultants() {
        UUID companyId = UUID.randomUUID();
        UUID consultantId = UUID.randomUUID();
        Company company = new Company();
        company.setId(companyId);
        User consultant = new User();
        consultant.setId(consultantId);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findAllById(List.of(consultantId))).thenReturn(List.of(consultant));
        when(repository.save(org.mockito.ArgumentMatchers.any(Project.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ProjectCreateRequest request = new ProjectCreateRequest(
                "Novo", companyId, null, null, List.of(consultantId), validRiskConfig());

        ProjectResponse response = service.createProject(request);

        assertEquals(1, response.consultantIds().size());
        assertEquals(consultantId, response.consultantIds().get(0));
    }

    @Test
    void updateProjectShouldUpdateNameDatesAndStatus() {
        UUID id = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        when(repository.findById(id)).thenReturn(Optional.of(project));

        ProjectUpdateRequest request = new ProjectUpdateRequest(
                " New Name ", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1), null, ProjectStatus.COMPLETED);

        ProjectResponse response = service.updateProject(id, request);

        assertEquals("New Name", response.name());
        assertEquals(ProjectStatus.COMPLETED, response.status());
    }

    @Test
    void updateProjectShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, null, null);

        assertThrows(ResourceNotFoundException.class, () -> service.updateProject(id, request));
    }

    @Test
    void updateProjectShouldThrowWhenNameBlank() {
        UUID id = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        when(repository.findById(id)).thenReturn(Optional.of(project));

        ProjectUpdateRequest request = new ProjectUpdateRequest("   ", null, null, null, null);

        assertThrows(ApiException.class, () -> service.updateProject(id, request));
    }

    @Test
    void updateProjectShouldThrowWhenDateRangeInvalid() {
        UUID id = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        when(repository.findById(id)).thenReturn(Optional.of(project));

        ProjectUpdateRequest request = new ProjectUpdateRequest(
                null, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 1, 1), null, null);

        assertThrows(ApiException.class, () -> service.updateProject(id, request));
    }

    @Test
    void updateProjectShouldAddNewConsultant() {
        UUID id = UUID.randomUUID();
        UUID consultantId = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        project.setProjectUsers(new ArrayList<>());
        User consultant = new User();
        consultant.setId(consultantId);

        when(repository.findById(id)).thenReturn(Optional.of(project));
        when(userRepository.findAllById(List.of(consultantId))).thenReturn(List.of(consultant));
        when(projectUserRepository.findAllByProjectIdIncludingDeleted(id)).thenReturn(List.of());

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, List.of(consultantId), null);
        ProjectResponse response = service.updateProject(id, request);

        assertEquals(1, response.consultantIds().size());
    }

    @Test
    void updateProjectShouldReactivateSoftDeletedConsultant() {
        UUID id = UUID.randomUUID();
        UUID consultantId = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        project.setProjectUsers(new ArrayList<>());
        User consultant = new User();
        consultant.setId(consultantId);

        ProjectUser existing = ProjectUser.builder().user(consultant).project(project).build();
        existing.setDeletedAt(LocalDateTime.now());
        existing.setDeletedBy("someone");

        when(repository.findById(id)).thenReturn(Optional.of(project));
        when(userRepository.findAllById(List.of(consultantId))).thenReturn(List.of(consultant));
        when(projectUserRepository.findAllByProjectIdIncludingDeleted(id)).thenReturn(List.of(existing));
        when(projectUserRepository.save(existing)).thenReturn(existing);

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, List.of(consultantId), null);
        service.updateProject(id, request);

        assertNull(existing.getDeletedAt());
        assertNull(existing.getDeletedBy());
    }

    @Test
    void updateProjectShouldRemoveConsultantsNotInNewList() {
        UUID id = UUID.randomUUID();
        UUID keepId = UUID.randomUUID();
        UUID removeId = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());

        User keepUser = new User();
        keepUser.setId(keepId);
        User removeUser = new User();
        removeUser.setId(removeId);
        ProjectUser keepPu = ProjectUser.builder().user(keepUser).project(project).build();
        ProjectUser removePu = ProjectUser.builder().user(removeUser).project(project).build();
        project.setProjectUsers(new ArrayList<>(List.of(keepPu, removePu)));

        when(repository.findById(id)).thenReturn(Optional.of(project));
        when(userRepository.findAllById(List.of(keepId))).thenReturn(List.of(keepUser));
        when(projectUserRepository.findAllByProjectIdIncludingDeleted(id))
                .thenReturn(List.of(keepPu, removePu));

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, List.of(keepId), null);
        ProjectResponse response = service.updateProject(id, request);

        assertEquals(1, response.consultantIds().size());
        assertEquals(keepId, response.consultantIds().get(0));
    }

    @Test
    void updateProjectShouldThrowWhenConsultantNotFound() {
        UUID id = UUID.randomUUID();
        UUID missingId = UUID.randomUUID();
        Project project = project(id, "Old", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());

        when(repository.findById(id)).thenReturn(Optional.of(project));
        when(userRepository.findAllById(List.of(missingId))).thenReturn(List.of());

        ProjectUpdateRequest request = new ProjectUpdateRequest(null, null, null, List.of(missingId), null);

        assertThrows(ResourceNotFoundException.class, () -> service.updateProject(id, request));
    }

    @Test
    void getSummaryShouldReturnCountsAndRiskClassification() {
        UUID projectId = UUID.randomUUID();
        Project project = project(projectId, "P", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        project.setConfiguration(ProjectConfiguration.createDefault());
        project.setEndDate(LocalDate.now().plusDays(10));

        when(repository.findById(projectId)).thenReturn(Optional.of(project));
        when(assetRepository.countByProjectId(projectId)).thenReturn(5L);
        when(artifactRepository.countByProjectId(projectId)).thenReturn(3L);
        when(findRepository.countByProjectId(projectId)).thenReturn(7L);
        when(riskRepository.countByProjectId(projectId)).thenReturn(4L);
        when(riskRepository.findGeneralRisksByProjectId(projectId))
                .thenReturn(List.of(1.0f, 5.0f, 9.0f));

        ProjectSummaryDTO summary = service.getSummary(projectId);

        assertEquals(5L, summary.assetCount());
        assertEquals(1L, summary.lowRisks());
        assertEquals(1L, summary.mediumRisks());
        assertEquals(1L, summary.highRisks());
        assertEquals(10, summary.daysRemaining());
    }

    @Test
    void getSummaryShouldReturnNullDaysRemainingWhenNoEndDate() {
        UUID projectId = UUID.randomUUID();
        Project project = project(projectId, "P", UUID.randomUUID(), ProjectStatus.IN_PROGRESS, LocalDateTime.now());
        project.setConfiguration(ProjectConfiguration.createDefault());
        project.setEndDate(null);

        when(repository.findById(projectId)).thenReturn(Optional.of(project));
        when(riskRepository.findGeneralRisksByProjectId(projectId)).thenReturn(List.of());

        ProjectSummaryDTO summary = service.getSummary(projectId);

        assertNull(summary.daysRemaining());
        assertEquals(0L, summary.highRisks());
    }

    @Test
    void getSummaryShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        when(repository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getSummary(projectId));
    }

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
