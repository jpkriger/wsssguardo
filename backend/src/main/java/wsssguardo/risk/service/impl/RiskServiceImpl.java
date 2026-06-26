package wsssguardo.risk.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskSummaryDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.risk.service.RiskService;
import wsssguardo.shared.domain.BaseEntity;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

  private final RiskRepository repository;
  private final ProjectRepository projectRepository;
  private final FindRepository findRepository;
  private final RiskMapper mapper;

  @Override
  @Transactional
  public RiskResponseDTO createRisk(UUID projectId, RiskCreateRequestDTO request) {
    Project project = projectRepository.findById(projectId)
        .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    List<Find> finds = findByIds(request.findIds(), findRepository, "Find", project.getId());

    Risk risk = mapper.toEntity(request, project, finds);
    applyGeneralRisk(project, risk);
    Risk savedRisk = repository.save(risk);
    return mapper.toResponse(savedRisk);
  }

  @Override
  public RiskPageResponseDTO findAllByProject(UUID projectId, Pageable pageable) {
    if (!projectRepository.existsById(projectId)) {
      throw new ResourceNotFoundException("Project", projectId);
    }
    Page<Risk> riskPage = repository.findAllByProjectId(projectId, pageable);
    return mapper.toPageDTO(riskPage);
  }

  @Override
  @Transactional(readOnly = true)
  public RiskSummaryDTO getRiskSummary(UUID projectId) {
    Project project = projectRepository.findById(projectId)
        .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

    List<RiskCategory> categories = project.getConfiguration().getRiskConfig().getCategories();
    List<Float> generalRisks = repository.findGeneralRisksByProjectId(projectId);
    long total = repository.countByProjectId(projectId);

    List<RiskCategory> sorted = categories.stream()
        .sorted(Comparator.comparingInt(RiskCategory::getMinRange))
        .toList();

    long low = 0, medium = 0, high = 0;
    for (Float level : generalRisks) {
      int idx = -1;
      for (int i = 0; i < sorted.size(); i++) {
        if (isInCategory(level, sorted, i)) {
          idx = i;
          break;
        }
      }
      if (idx == 0) low++;
      else if (idx == sorted.size() - 1) high++;
      else if (idx > 0) medium++;
    }

    return new RiskSummaryDTO(total, high, medium, low);
  }

  @Override
  @Transactional
  public RiskResponseDTO update(UUID projectId, UUID id, RiskUpdateRequestDTO dto) {
    Risk risk = repository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Risk", id));

    if (!risk.getProject().getId().equals(projectId)) {
      throw new ApiException("Risk does not belong to the given project", HttpStatus.NOT_FOUND);
    }

    List<Find> finds = dto.findIds() != null
        ? findByIds(dto.findIds(), findRepository, "Find", projectId)
        : null;

    risk = mapper.updateEntity(risk, dto, finds);
    applyGeneralRisk(risk.getProject(), risk);

    return mapper.toResponse(repository.save(risk));
  }

  @Override
  @Transactional
  public void delete(UUID projectId, UUID id, String username) {
    Risk risk = repository.findById(id)
        .orElseThrow(() -> new ApiException("Risk not found with id: " + id, HttpStatus.NOT_FOUND));

    if (!risk.getProject().getId().equals(projectId)) {
      throw new ApiException("Risk does not belong to the given project", HttpStatus.NOT_FOUND);
    }

    risk.softDelete(username);
    repository.save(risk);
  }

  private <T extends BaseEntity> List<T> findByIds(List<UUID> ids,
      org.springframework.data.jpa.repository.JpaRepository<T, UUID> repository, String resourceName, UUID projectId) {
    if (ids == null || ids.isEmpty()) {
      return new ArrayList<>();
    }

    List<UUID> uniqueIds = ids.stream().distinct().toList();
    List<T> entities = repository.findAllById(uniqueIds);
    Map<UUID, T> entitiesById = entities.stream()
        .collect(Collectors.toMap(BaseEntity::getId, Function.identity()));
    Set<UUID> foundIds = entitiesById.keySet();

    UUID missingId = uniqueIds.stream()
        .filter(id -> !foundIds.contains(id))
        .findFirst()
        .orElse(null);

    if (missingId != null) {
      throw new ResourceNotFoundException(resourceName, missingId);
    }

    for (T entity : entities) {
      if (entity instanceof Find f && !f.getProject().getId().equals(projectId)) {
        throw new ApiException("Find " + f.getId() + " does not belong to Project " + projectId, HttpStatus.BAD_REQUEST);
      }
    }

    return new ArrayList<>(uniqueIds.stream().map(entitiesById::get).toList());
  }

  private void applyGeneralRisk(Project project, Risk risk) {
    validateDamageScores(project.getConfiguration().getRiskConfig(), risk);
    risk.setGeneralRisk(average(
        risk.getDamageOperations(),
        risk.getDamageAssets(),
        risk.getDamageIndividuals(),
        risk.getDamageOtherOrgs()));
  }

  private void validateDamageScores(RiskConfig riskConfig, Risk risk) {
    validateDamageScore("damageOperations", risk.getDamageOperations(), riskConfig);
    validateDamageScore("damageAssets", risk.getDamageAssets(), riskConfig);
    validateDamageScore("damageIndividuals", risk.getDamageIndividuals(), riskConfig);
    validateDamageScore("damageOtherOrgs", risk.getDamageOtherOrgs(), riskConfig);
  }

  private void validateDamageScore(String fieldName, Float value, RiskConfig riskConfig) {
    if (value == null) {
      throw new ApiException(fieldName + " must not be null", HttpStatus.BAD_REQUEST);
    }
    if (riskConfig == null || riskConfig.getMinRange() == null || riskConfig.getMaxRange() == null) {
      throw new ApiException("Project risk scale is not configured", HttpStatus.BAD_REQUEST);
    }
    if (value < riskConfig.getMinRange() || value > riskConfig.getMaxRange()) {
      throw new ApiException(
          fieldName + " must be between " + riskConfig.getMinRange() + " and " + riskConfig.getMaxRange(),
          HttpStatus.BAD_REQUEST);
    }
  }

  private Float average(Float... values) {
    float total = 0F;
    for (Float value : values) {
      total += value;
    }
    return total / values.length;
  }

  private boolean isInCategory(Float level, List<RiskCategory> categories, int index) {
    RiskCategory category = categories.get(index);
    boolean isLast = index == categories.size() - 1;
    if (isLast) {
      return level >= category.getMinRange() && level <= category.getMaxRange();
    }
    return level >= category.getMinRange() && level < categories.get(index + 1).getMinRange();
  }
}
