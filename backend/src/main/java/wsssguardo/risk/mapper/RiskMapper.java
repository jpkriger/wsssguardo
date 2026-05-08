package wsssguardo.risk.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

@Component
public class RiskMapper {

    public Risk toEntity(RiskCreateRequestDTO request, Project project,
        List<Find> finds, List<Asset> damageAssets, String username) {
        Risk risk = Risk.builder()
            .name(request.name())
            .project(project)
            .description(request.description())
            .consequences(request.consequences())
            .occurrenceProbability(request.occurrenceProbability())
            .impactProbability(request.impactProbability())
            .damageOperations(request.damageOperations())
            .finds(finds)
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
            risk.getName(),
            risk.getProject().getId(),
            risk.getDescription(),
            risk.getConsequences(),
            risk.getOccurrenceProbability(),
            risk.getImpactProbability(),
            risk.getDamageOperations(),
            risk.getFinds() != null
                ? risk.getFinds().stream().map(Find::getId).toList()
                : List.of(),
            risk.getDamageAssets() != null
                ? risk.getDamageAssets().stream().map(Asset::getId).toList()
                : List.of(),
            risk.getDamageIndividuals(),
            risk.getDamageOtherOrgs(),
            risk.getRecommendation(),
            risk.getRiskLevel(),
            risk.getCreatedBy(),
            risk.getCreatedAt(),
            risk.getUpdatedAt()
        );
    }

    public Risk updateEntity(Risk risk, RiskUpdateRequestDTO request,
                             List<Find> finds, List<Asset> damageAssets, String username) {
        boolean changed = false;

        changed |= applyName(risk, request.name());
        changed |= applyDescription(risk, request.description());
        changed |= applyConsequences(risk, request.consequences());
        changed |= applyOccurrenceProbability(risk, request.occurrenceProbability());
        changed |= applyImpactProbability(risk, request.impactProbability());
        changed |= applyDamageOperations(risk, request.damageOperations());
        changed |= applyFinds(risk, finds);
        changed |= applyDamageAssets(risk, damageAssets);
        changed |= applyDamageIndividuals(risk, request.damageIndividuals());
        changed |= applyDamageOtherOrgs(risk, request.damageOtherOrgs());
        changed |= applyRecommendation(risk, request.recommendation());
        changed |= applyRiskLevel(risk, request.riskLevel());

        if (changed) applyAudit(risk, username);

        return risk;
    }

    public void deleteEntity(Risk risk, String deletedBy) {
        risk.setDeletedAt(LocalDateTime.now());
        risk.setDeletedBy(deletedBy);
    }

    // --- métodos de campo ---

    boolean applyName(Risk r, String v)                        { if (v == null) return false; r.setName(v); return true; }
    boolean applyDescription(Risk r, String v)                 { if (v == null) return false; r.setDescription(v); return true; }
    boolean applyConsequences(Risk r, String v)                { if (v == null) return false; r.setConsequences(v); return true; }
    boolean applyOccurrenceProbability(Risk r, Float v)        { if (v == null) return false; r.setOccurrenceProbability(v); return true; }
    boolean applyImpactProbability(Risk r, Float v)            { if (v == null) return false; r.setImpactProbability(v); return true; }
    boolean applyDamageOperations(Risk r, String v)            { if (v == null) return false; r.setDamageOperations(v); return true; }
    boolean applyFinds(Risk r, List<Find> v)                   { if (v == null) return false; r.setFinds(v); return true; }
    boolean applyDamageAssets(Risk r, List<Asset> v)           { if (v == null) return false; r.setDamageAssets(v); return true; }
    boolean applyDamageIndividuals(Risk r, String v)           { if (v == null) return false; r.setDamageIndividuals(v); return true; }
    boolean applyDamageOtherOrgs(Risk r, String v)             { if (v == null) return false; r.setDamageOtherOrgs(v); return true; }
    boolean applyRecommendation(Risk r, String v)              { if (v == null) return false; r.setRecommendation(v); return true; }
    boolean applyRiskLevel(Risk r, Integer v)                  { if (v == null) return false; r.setRiskLevel(v); return true; }

    void applyAudit(Risk risk, String username) {
        risk.setUpdatedAt(LocalDateTime.now());
        risk.setLastModifiedBy(username);
    }
}