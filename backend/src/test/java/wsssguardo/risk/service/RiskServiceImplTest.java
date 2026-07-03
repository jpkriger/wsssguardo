package wsssguardo.risk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.RiskPriority;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskSummaryDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.risk.service.impl.RiskServiceImpl;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class RiskServiceImplTest {

  @Mock
  private RiskRepository repository;

  @Mock
  private ProjectRepository projectRepository;

  @Mock
  private FindRepository findRepository;

  @Spy
  private RiskMapper mapper;

  @InjectMocks
  private RiskServiceImpl service;

  @Test
  void createRiskShouldPersistAndReturnResponse() {
    UUID projectId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    RiskCreateRequestDTO request = request(List.of(findId));

    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Find find = new Find();
    find.setId(findId);
    find.setProject(project);
    Risk savedRisk = new Risk();
    RiskResponseDTO expectedResponse = new RiskResponseDTO(
        UUID.randomUUID(), projectId, "Risk name", List.of(findId), "Description", "Consequences",
        0.25F, 0.5F, 8F, 7F, 6F, 9F, 7.5F, RiskPriority.P1, null,
        "Recommendation", null, null, null);

    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of(find));
    when(repository.save(any(Risk.class))).thenReturn(savedRisk);
    doReturn(expectedResponse).when(mapper).toResponse(savedRisk);

    RiskResponseDTO actualResponse = service.createRisk(projectId, request);

    assertEquals(expectedResponse, actualResponse);
    verify(projectRepository).findById(projectId);
    verify(findRepository).findAllById(List.of(findId));
    verify(repository).save(any(Risk.class));
  }

  @Test
  void createRiskShouldCalculateGeneralRisk() {
    UUID projectId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    RiskCreateRequestDTO request = request(List.of(findId));

    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Find find = new Find();
    find.setId(findId);
    find.setProject(project);

    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of(find));
    when(repository.save(any(Risk.class))).thenAnswer(invocation -> invocation.getArgument(0));

    RiskResponseDTO response = service.createRisk(projectId, request);

    assertEquals(7.5F, response.generalRisk());
  }

  @Test
  void createRiskShouldThrowWhenDamageScoreIsOutOfProjectScale() {
    UUID projectId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    RiskCreateRequestDTO request = new RiskCreateRequestDTO(
        "Risk name",
        List.of(findId),
        "Description",
        "Consequences",
        0.25F,
        0.5F,
        11F,
        7F,
        6F,
        9F,
        "Recommendation",
        RiskPriority.P1);

    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Find find = new Find();
    find.setId(findId);
    find.setProject(project);

    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of(find));

    assertThrows(ApiException.class, () -> service.createRisk(projectId, request));
    verifyNoInteractions(repository);
  }

  @Test
  void createRiskShouldThrowWhenProjectDoesNotExist() {
    UUID projectId = UUID.randomUUID();
    RiskCreateRequestDTO request = request(List.of());

    when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> service.createRisk(projectId, request));
    verify(projectRepository).findById(projectId);
    verifyNoInteractions(findRepository);
    verifyNoInteractions(repository);
  }

  @Test
  void createRiskShouldThrowWhenFindDoesNotExist() {
    UUID projectId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    RiskCreateRequestDTO request = request(List.of(findId));

    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());

    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of());

    assertThrows(ResourceNotFoundException.class, () -> service.createRisk(projectId, request));
    verifyNoInteractions(repository);
  }

  @Test
  void findAllByProjectShouldReturnPagedRisks() {
    UUID projectId = UUID.randomUUID();
    Pageable pageable = PageRequest.of(0, 10);
    Page<Risk> page = new PageImpl<>(List.of(new Risk()));

    when(projectRepository.existsById(projectId)).thenReturn(true);
    when(repository.findAllByProjectId(projectId, pageable)).thenReturn(page);

    RiskPageResponseDTO result = service.findAllByProject(projectId, pageable);

    assertEquals(1, result.content().size());
  }

  @Test
  void findAllByProjectShouldThrowWhenProjectNotFound() {
    UUID projectId = UUID.randomUUID();
    when(projectRepository.existsById(projectId)).thenReturn(false);

    assertThrows(ResourceNotFoundException.class, () ->
        service.findAllByProject(projectId, PageRequest.of(0, 10)));
  }

  @Test
  void getRiskSummaryShouldClassifyRisksByCategory() {
    UUID projectId = UUID.randomUUID();
    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());

    when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
    when(repository.findGeneralRisksByProjectId(projectId)).thenReturn(List.of(1F, 5F, 9F));
    when(repository.countByProjectId(projectId)).thenReturn(3L);

    RiskSummaryDTO summary = service.getRiskSummary(projectId);

    assertEquals(3L, summary.total());
    assertEquals(1L, summary.lowRisks());
    assertEquals(1L, summary.mediumRisks());
    assertEquals(1L, summary.highRisks());
  }

  @Test
  void getRiskSummaryShouldThrowWhenProjectNotFound() {
    UUID projectId = UUID.randomUUID();
    when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> service.getRiskSummary(projectId));
  }

  @Test
  void updateShouldApplyChangesAndRecalculateGeneralRisk() {
    UUID projectId = UUID.randomUUID();
    UUID riskId = UUID.randomUUID();
    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);
    risk.setFinds(new java.util.ArrayList<>());
    risk.setDamageOperations(8F);
    risk.setDamageAssets(8F);
    risk.setDamageIndividuals(8F);
    risk.setDamageOtherOrgs(8F);

    RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(
        "New", null, null, null, null, null, null, null, null, null, null, null);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));
    when(repository.save(any(Risk.class))).thenAnswer(inv -> inv.getArgument(0));

    RiskResponseDTO response = service.update(projectId, riskId, dto);

    assertEquals("New", response.name());
    assertEquals(8F, response.generalRisk());
  }

  @Test
  void updateShouldReplaceFindsWhenProvided() {
    UUID projectId = UUID.randomUUID();
    UUID riskId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);
    risk.setFinds(new java.util.ArrayList<>());
    risk.setDamageOperations(5F);
    risk.setDamageAssets(5F);
    risk.setDamageIndividuals(5F);
    risk.setDamageOtherOrgs(5F);
    Find find = new Find();
    find.setId(findId);
    find.setProject(project);

    RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(
        null, null, null, null, null, null, List.of(findId), null, null, null, null, null);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of(find));
    when(repository.save(any(Risk.class))).thenAnswer(inv -> inv.getArgument(0));

    RiskResponseDTO response = service.update(projectId, riskId, dto);

    assertEquals(List.of(findId), response.findIds());
  }

  @Test
  void updateShouldThrowWhenRiskNotFound() {
    UUID riskId = UUID.randomUUID();
    when(repository.findById(riskId)).thenReturn(Optional.empty());

    RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(
        null, null, null, null, null, null, null, null, null, null, null, null);

    assertThrows(ResourceNotFoundException.class, () -> service.update(UUID.randomUUID(), riskId, dto));
  }

  @Test
  void updateShouldThrowWhenRiskBelongsToAnotherProject() {
    UUID riskId = UUID.randomUUID();
    Project project = new Project();
    project.setId(UUID.randomUUID());
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));

    RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(
        null, null, null, null, null, null, null, null, null, null, null, null);

    assertThrows(ApiException.class, () -> service.update(UUID.randomUUID(), riskId, dto));
  }

  @Test
  void updateShouldThrowWhenFindBelongsToAnotherProject() {
    UUID projectId = UUID.randomUUID();
    UUID otherProjectId = UUID.randomUUID();
    UUID riskId = UUID.randomUUID();
    UUID findId = UUID.randomUUID();
    Project project = new Project();
    project.setId(projectId);
    project.setConfiguration(ProjectConfiguration.createDefault());
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);

    Project otherProject = new Project();
    otherProject.setId(otherProjectId);
    Find find = new Find();
    find.setId(findId);
    find.setProject(otherProject);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));
    when(findRepository.findAllById(List.of(findId))).thenReturn(List.of(find));

    RiskUpdateRequestDTO dto = new RiskUpdateRequestDTO(
        null, null, null, null, null, null, List.of(findId), null, null, null, null, null);

    assertThrows(ApiException.class, () -> service.update(projectId, riskId, dto));
  }

  @Test
  void deleteShouldSoftDeleteRisk() {
    UUID projectId = UUID.randomUUID();
    UUID riskId = UUID.randomUUID();
    Project project = new Project();
    project.setId(projectId);
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));

    service.delete(projectId, riskId, "tester");

    verify(repository).save(risk);
  }

  @Test
  void deleteShouldThrowWhenRiskNotFound() {
    UUID riskId = UUID.randomUUID();
    when(repository.findById(riskId)).thenReturn(Optional.empty());

    assertThrows(ApiException.class, () -> service.delete(UUID.randomUUID(), riskId, "tester"));
  }

  @Test
  void deleteShouldThrowWhenRiskBelongsToAnotherProject() {
    UUID riskId = UUID.randomUUID();
    Project project = new Project();
    project.setId(UUID.randomUUID());
    Risk risk = new Risk();
    risk.setId(riskId);
    risk.setProject(project);

    when(repository.findById(riskId)).thenReturn(Optional.of(risk));

    assertThrows(ApiException.class, () -> service.delete(UUID.randomUUID(), riskId, "tester"));
  }

  private RiskCreateRequestDTO request(List<UUID> findIds) {
    return new RiskCreateRequestDTO(
        "Risk name",
        findIds,
        "Description",
        "Consequences",
        0.25F,
        0.5F,
        8F,
        7F,
        6F,
        9F,
        "Recommendation",
        RiskPriority.P1);
  }
}
