package wsssguardo.risk.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
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
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ApiException;

@Service
@RequiredArgsConstructor
public class RiskService {

  private final RiskRepository repository;
  private final ProjectRepository projectRepository;
  private final FindRepository findRepository;
  private final AssetRepository assetRepository;

  @Transactional
  public Risk update(UUID id, RiskCreateRequestDTO dto) {
    Risk risk = repository.findById(id)
      .orElseThrow(() -> new ApiException("Risk not found with id: " + id, HttpStatus.NOT_FOUND));

    Project project = projectRepository.findById(dto.projectId())
      .orElseThrow(() -> new ApiException("Project not found with id: " + dto.projectId(), HttpStatus.NOT_FOUND));

    List<Find> finds = findRepository.findAllById(
        dto.findIds() != null ? dto.findIds() : List.of());
    List<Asset> assets = assetRepository.findAllById(
        dto.damageAssetIds() != null ? dto.damageAssetIds() : List.of());

    risk.setName(dto.name());
    risk.setProject(project);
    risk.setDescription(dto.description());
    risk.setConsequences(dto.consequences());
    risk.setOccurrenceProbability(dto.occurrenceProbability());
    risk.setImpactProbability(dto.impactProbability());
    risk.setDamageOperations(dto.damageOperations());
    risk.setFinds(finds);
    risk.setDamageAssets(assets);
    risk.setDamageIndividuals(dto.damageIndividuals());
    risk.setDamageOtherOrgs(dto.damageOtherOrgs());
    risk.setRecommendation(dto.recommendation());
    risk.setRiskLevel(dto.riskLevel());

    return repository.save(risk);
  }

  @Transactional
    public void delete(UUID id) {
    if (!repository.existsById(id)) {
      throw new ApiException("Risk not found with id: " + id, HttpStatus.NOT_FOUND);
    }
    repository.deleteById(id); // soft delete automático
  }
}
