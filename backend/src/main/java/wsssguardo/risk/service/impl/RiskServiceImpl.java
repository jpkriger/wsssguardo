package wsssguardo.risk.service.impl;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.risk.service.RiskService;
import wsssguardo.shared.domain.BaseEntity;
import wsssguardo.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

  private final RiskRepository repository;
  private final ProjectRepository projectRepository;
  private final FindRepository findRepository;
  private final AssetRepository assetRepository;
  private final RiskMapper mapper;

  @Override
  @Transactional
  public RiskResponseDTO createRisk(RiskCreateRequestDTO request, String username) {
    Project project = projectRepository.findById(request.projectId())
        .orElseThrow(() -> new ResourceNotFoundException("Project", request.projectId()));
    List<Find> finds = findByIds(request.findIds(), findRepository, "Find");
    List<Asset> damageAssets = findByIds(request.damageAssetIds(), assetRepository, "Asset");

    Risk risk = mapper.toEntity(request, project, finds, damageAssets, username);
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

  private <T extends BaseEntity> List<T> findByIds(List<UUID> ids,
      org.springframework.data.jpa.repository.JpaRepository<T, UUID> repository, String resourceName) {
    if (ids == null || ids.isEmpty()) {
      return List.of();
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

    return uniqueIds.stream().map(entitiesById::get).toList();
  }
}
