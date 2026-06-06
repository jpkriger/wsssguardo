package wsssguardo.risk.mapper;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

@Component
public class RiskMapper {

  public Risk toEntity(RiskCreateRequestDTO request, Project project, List<Find> finds) {
    Risk risk = Risk.builder()
        .project(project)
        .name(request.name().trim())
        .finds(finds)
        .description(request.description())
        .consequences(request.consequences())
        .occurrenceProbability(request.occurrenceProbability())
        .impactProbability(request.impactProbability())
        .damageOperations(request.damageOperations())
        .damageIndividuals(request.damageIndividuals())
        .damageOtherOrgs(request.damageOtherOrgs())
        .recommendation(request.recommendation())
        .riskLevel(request.riskLevel())
        .build();
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

  public Risk updateEntity(Risk risk, RiskUpdateRequestDTO request, List<Find> finds) {

    applyName(risk, request.name());
    applyDescription(risk, request.description());
    applyConsequences(risk, request.consequences());
    applyOccurrenceProbability(risk, request.occurrenceProbability());
    applyImpactProbability(risk, request.impactProbability());
    applyDamageOperations(risk, request.damageOperations());
    applyFinds(risk, finds);
    applyDamageIndividuals(risk, request.damageIndividuals());
    applyDamageOtherOrgs(risk, request.damageOtherOrgs());
    applyRecommendation(risk, request.recommendation());
    applyRiskLevel(risk, request.riskLevel());

    return risk;
  }

  // --- helper methods ---

  private List<UUID> idsFromFinds(List<Find> finds) {
    if (finds == null || finds.isEmpty()) {
      return List.of();
    }
    return finds.stream().map(Find::getId).toList();
  }

  // --- field-level apply methods ---

  boolean applyName(Risk r, String v)                        { if (v == null) return false; r.setName(v); return true; }
  boolean applyDescription(Risk r, String v)                 { if (v == null) return false; r.setDescription(v); return true; }
  boolean applyConsequences(Risk r, String v)                { if (v == null) return false; r.setConsequences(v); return true; }
  boolean applyOccurrenceProbability(Risk r, Float v)        { if (v == null) return false; r.setOccurrenceProbability(v); return true; }
  boolean applyImpactProbability(Risk r, Float v)            { if (v == null) return false; r.setImpactProbability(v); return true; }
  boolean applyDamageOperations(Risk r, String v)            { if (v == null) return false; r.setDamageOperations(v); return true; }
  boolean applyFinds(Risk r, List<Find> v) {
    if (v == null) return false;
    r.getFinds().clear();
    r.getFinds().addAll(v);
    return true;
  }

  boolean applyDamageIndividuals(Risk r, String v)           { if (v == null) return false; r.setDamageIndividuals(v); return true; }
  boolean applyDamageOtherOrgs(Risk r, String v)             { if (v == null) return false; r.setDamageOtherOrgs(v); return true; }
  boolean applyRecommendation(Risk r, String v)              { if (v == null) return false; r.setRecommendation(v); return true; }
  boolean applyRiskLevel(Risk r, Integer v)                  { if (v == null) return false; r.setRiskLevel(v); return true; }

}
