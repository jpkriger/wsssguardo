package wsssguardo.archive.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.archive.dto.export.ArtifactExportDTO;
import wsssguardo.archive.dto.export.AssetExportDTO;
import wsssguardo.archive.dto.export.AuditDTO;
import wsssguardo.archive.dto.export.FindExportDTO;
import wsssguardo.archive.dto.export.ProjectArchiveDTO;
import wsssguardo.archive.dto.export.ProjectNodeDTO;
import wsssguardo.archive.dto.export.ProjectUserExportDTO;
import wsssguardo.archive.dto.export.ReferencesDTO;
import wsssguardo.archive.dto.export.RiskExportDTO;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.find.domain.FindCategory;
import wsssguardo.find.repository.FindCategoryRepository;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.project.repository.ProjectUserRepository;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.domain.BaseEntity;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.repository.UserRepository;

/**
 * Monta o agregado normalizado (sem redundância, com tombstones) de um projeto.
 *
 * <p>Cada entidade aparece uma única vez na sua lista; relacionamentos são ids.
 * A M2M risks_finds é representada apenas no lado Risk ({@code findIds}). Todas as
 * listas são ordenadas por id para que a serialização seja determinística.
 */
@Component
@RequiredArgsConstructor
public class ProjectArchiveExporter {

    private final ProjectRepository projectRepository;
    private final AssetRepository assetRepository;
    private final ArtifactRepository artifactRepository;
    private final FindRepository findRepository;
    private final RiskRepository riskRepository;
    private final ProjectUserRepository projectUserRepository;
    private final UserRepository userRepository;
    private final FindCategoryRepository findCategoryRepository;

    @Transactional(readOnly = true)
    public ProjectArchiveDTO export(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        List<AssetExportDTO> assets = assetRepository.findAllByProjectIdIncludingDeleted(projectId).stream()
                .sorted(Comparator.comparing(a -> a.getId()))
                .map(a -> new AssetExportDTO(a.getId(), a.getName(), a.getDescription(), a.getContent(), audit(a)))
                .toList();

        List<ArtifactExportDTO> artifacts = artifactRepository.findAllByProjectIdIncludingDeleted(projectId).stream()
                .sorted(Comparator.comparing(a -> a.getId()))
                .map(a -> new ArtifactExportDTO(a.getId(), a.getName(), a.getDescription(), a.getContent(),
                        a.getCategory(), a.getDriveLink(), a.getLlmSummary(),
                        a.getType() != null ? a.getType().name() : null, audit(a)))
                .toList();

        Map<UUID, List<UUID>> findAssets = groupLinks(findRepository.findAssetLinksByProjectId(projectId));
        Map<UUID, List<UUID>> findArtifacts = groupLinks(findRepository.findArtifactLinksByProjectId(projectId));
        Map<UUID, List<UUID>> findCategories = groupLinks(findRepository.findCategoryLinksByProjectId(projectId));

        List<FindExportDTO> finds = findRepository.findAllByProjectIdIncludingDeleted(projectId).stream()
                .sorted(Comparator.comparing(f -> f.getId()))
                .map(f -> new FindExportDTO(
                        f.getId(), f.getName(), f.getDescription(), f.getSector(),
                        f.getQuantitativeCriticality(), f.getNumericSeverity(),
                        f.getCategoricalSeverity() != null ? f.getCategoricalSeverity().name() : null,
                        f.getCategory(), f.getThreatEvent(), f.getReference(), f.getRecommendation(),
                        findAssets.getOrDefault(f.getId(), List.of()),
                        findArtifacts.getOrDefault(f.getId(), List.of()),
                        findCategories.getOrDefault(f.getId(), List.of()),
                        audit(f)))
                .toList();

        Map<UUID, List<UUID>> riskFinds = groupLinks(riskRepository.findFindLinksByProjectId(projectId));

        List<RiskExportDTO> risks = riskRepository.findAllByProjectIdIncludingDeleted(projectId).stream()
                .sorted(Comparator.comparing(r -> r.getId()))
                .map(r -> new RiskExportDTO(
                        r.getId(), r.getName(), r.getDescription(), r.getConsequences(),
                        r.getOccurrenceProbability(), r.getImpactProbability(), r.getRiskLevel(),
                        r.getDamageOperations(), r.getDamageIndividuals(), r.getDamageOtherOrgs(),
                        r.getRecommendation(),
                        riskFinds.getOrDefault(r.getId(), List.of()),
                        audit(r)))
                .toList();

        List<ProjectUserExportDTO> projectUsers = projectUserRepository
                .findAllByProjectIdIncludingDeleted(projectId).stream()
                .sorted(Comparator.comparing(pu -> pu.getId()))
                // getUser().getId() lê apenas a FK (não inicializa o proxy), seguro p/ usuário deletado.
                .map(pu -> new ProjectUserExportDTO(pu.getId(), pu.getUser().getId(), audit(pu)))
                .toList();

        ReferencesDTO references = buildReferences(project, projectUsers, findCategories);

        ProjectNodeDTO node = new ProjectNodeDTO(
                project.getId(), project.getName(),
                project.getStatus() != null ? project.getStatus().name() : null,
                project.getStartDate(), project.getEndDate(),
                project.getCompany() != null ? project.getCompany().getId() : null,
                project.getConfiguration(),
                audit(project));

        return new ProjectArchiveDTO(
                ProjectArchiveDTO.CURRENT_SCHEMA_VERSION,
                java.time.Instant.now(),
                true,
                node, assets, artifacts, finds, risks, projectUsers, references);
    }

    private ReferencesDTO buildReferences(Project project,
                                          List<ProjectUserExportDTO> projectUsers,
                                          Map<UUID, List<UUID>> findCategories) {
        List<ReferencesDTO.CompanyRef> companies = project.getCompany() == null ? List.of()
                : List.of(new ReferencesDTO.CompanyRef(project.getCompany().getId(), project.getCompany().getName()));

        Set<UUID> userIds = projectUsers.stream()
                .map(ProjectUserExportDTO::userId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<ReferencesDTO.UserRef> users = userRepository.findAllById(userIds).stream()
                .sorted(Comparator.comparing(User::getId))
                .map(u -> new ReferencesDTO.UserRef(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : null))
                .toList();

        Set<UUID> categoryIds = findCategories.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<ReferencesDTO.FindCategoryRef> categories = findCategoryRepository.findAllById(categoryIds).stream()
                .sorted(Comparator.comparing(FindCategory::getId))
                .map(c -> new ReferencesDTO.FindCategoryRef(c.getId(), c.getName()))
                .toList();

        return new ReferencesDTO(companies, users, categories);
    }

    /** Agrupa pares nativos [ownerId, refId] em ownerId -> [refId ordenados]. */
    private Map<UUID, List<UUID>> groupLinks(List<Object[]> pairs) {
        Map<UUID, List<UUID>> map = new java.util.HashMap<>();
        for (Object[] pair : pairs) {
            UUID owner = (UUID) pair[0];
            UUID ref = (UUID) pair[1];
            map.computeIfAbsent(owner, k -> new ArrayList<>()).add(ref);
        }
        map.values().forEach(list -> list.sort(Comparator.naturalOrder()));
        return map;
    }

    private AuditDTO audit(BaseEntity e) {
        return new AuditDTO(e.getCreatedAt(), e.getUpdatedAt(), e.getDeletedAt(),
                e.getCreatedBy(), e.getLastModifiedBy(), e.getDeletedBy());
    }
}
