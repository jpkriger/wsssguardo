package wsssguardo.risk.mapper;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

@Component
@RequiredArgsConstructor
public class RiskMapper {

  private final RiskLevelMapper riskLevelMapper;

  public RiskResponseDTO toResponse(Risk risk, RiskConfig riskConfig) {
    return new RiskResponseDTO(
        risk.getId(),
        risk.getProject() != null ? risk.getProject().getId() : null,
        risk.getName(),
        idsFromFinds(risk.getFinds()),
        risk.getDescription(),
        risk.getConsequences(),
        risk.getOccurrenceProbability(),
        risk.getImpactProbability(),
        risk.getDamageOperations(),
        idsFromAssets(risk.getDamageAssets()),
        risk.getDamageIndividuals(),
        risk.getDamageOtherOrgs(),
        risk.getRecommendation(),
        riskLevelMapper.toDTO(risk.getRiskLevel(), riskConfig),
        risk.getCreatedBy(),
        risk.getCreatedAt(),
        risk.getUpdatedAt());
  }

  public RiskPageResponseDTO toPageDTO(Page<Risk> page, RiskConfig riskConfig) {
    return new RiskPageResponseDTO(
        page.getContent().stream().map(r -> toResponse(r, riskConfig)).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast()
    );
  }

  private List<UUID> idsFromFinds(List<Find> finds) {
    if (finds == null || finds.isEmpty()) {
      return List.of();
    }
    return finds.stream().map(Find::getId).toList();
  }

  private List<UUID> idsFromAssets(List<Asset> assets) {
    if (assets == null || assets.isEmpty()) {
      return List.of();
    }
    return assets.stream().map(Asset::getId).toList();
  }
}
