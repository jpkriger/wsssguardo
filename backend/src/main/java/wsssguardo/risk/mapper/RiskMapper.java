package wsssguardo.risk.mapper;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

@Component
public class RiskMapper {

  public Risk toEntity(RiskCreateRequestDTO request, Project project, List<Find> finds,
      List<Asset> damageAssets, String username) {
    Risk risk = Risk.builder()
        .project(project)
        .name(request.name().trim())
        .finds(finds)
        .description(request.description())
        .consequences(request.consequences())
        .occurrenceProbability(request.occurrenceProbability())
        .impactProbability(request.impactProbability())
        .damageOperations(request.damageOperations())
        .damageAssets(damageAssets)
        .damageIndividuals(request.damageIndividuals())
        .damageOtherOrgs(request.damageOtherOrgs())
        .recommendation(request.recommendation())
        .riskLevel(request.riskLevel())
        .build();
    risk.setCreatedBy(username);
    return risk;
  }

  public RiskResponseDTO toResponse(Risk risk) {
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
        risk.getRiskLevel(),
        risk.getCreatedBy(),
        risk.getCreatedAt(),
        risk.getUpdatedAt());
  }

  public RiskPageResponseDTO toPageDTO(Page<Risk> page) {
    return new RiskPageResponseDTO(
        page.getContent().stream().map(this::toResponse).toList(),
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
