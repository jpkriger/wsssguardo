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
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.risk.service.impl.RiskServiceImpl;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

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
