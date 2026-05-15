package wsssguardo.artifact.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.requestdto.ArtifactUpdateRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO.FindingsSummary;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO.RisksSummary;
import wsssguardo.artifact.mapper.ArtifactMapper;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    private final ArtifactRepository repository;
    private final ProjectRepository projectRepository;
    private final ArtifactMapper mapper;

    @Transactional(readOnly = true)
    public List<ArtifactResponseDTO> listByProject(UUID projectId, ArtifactType type) {
        Project project = requireProjectExists(projectId);

        List<Artifact> results = (type != null)
                ? repository.findAllByProjectIdAndTypeOrderByCreatedAtDesc(projectId, type)
                : repository.findAllByProjectIdOrderByCreatedAtDesc(projectId);

        if (results.isEmpty()) {
            return List.of();
        }

        List<RiskCategory> categories = project.getConfiguration().getRiskConfig().getCategories();
        Map<UUID, long[]> findingsMap = toFindingsMap(repository.findFindingsSummaryByProjectId(projectId));
        Map<UUID, long[]> risksMap = buildRisksMap(repository.findRiskLevelsByArtifactAndProjectId(projectId), categories);

        return results.stream()
                .map(artifact -> {
                    long[] f = findingsMap.getOrDefault(artifact.getId(), new long[]{0L, 0L, 0L});
                    long[] r = risksMap.getOrDefault(artifact.getId(), new long[]{0L, 0L, 0L});
                    return mapper.toResponse(
                            artifact,
                            new FindingsSummary((int) f[0], (int) f[1], (int) f[2]),
                            new RisksSummary((int) r[0], (int) r[1], (int) r[2])
                    );
                })
                .toList();
    }

    @Transactional
    public ArtifactResponseDTO create(UUID projectId, ArtifactRequestDTO request) {
        Project project = requireProjectExists(projectId);
        Artifact artifact = mapper.toEntity(request, project);
        return mapper.toResponse(repository.saveAndFlush(artifact));
    }

    @Transactional(readOnly = true)
    public ArtifactResponseDTO getById(UUID projectId, UUID id) {
        Project project = requireProjectExists(projectId);
        Artifact artifact = requireArtifactExists(projectId, id);

        List<RiskCategory> categories = project.getConfiguration().getRiskConfig().getCategories();
        long[] f = resolveSingleFindingsSummary(projectId, id);
        long[] r = resolveSingleRisksSummary(projectId, id, categories);

        return mapper.toResponse(
                artifact,
                new FindingsSummary((int) f[0], (int) f[1], (int) f[2]),
                new RisksSummary((int) r[0], (int) r[1], (int) r[2])
        );
    }

    @Transactional
    public ArtifactResponseDTO update(UUID projectId, UUID id, ArtifactUpdateRequestDTO request) {
        Artifact artifact = requireArtifactExists(projectId, id);
        if (request.name() != null) {
            artifact.setName(request.name());
        }

        if (request.description() != null){
            artifact.setDescription(request.description());
        }
        if (request.content() != null){
            artifact.setContent(request.content());
        }
        if (request.category() != null){
            artifact.setCategory(request.category());
        }

        if (request.driveLink() != null){
            artifact.setDriveLink(request.driveLink());
        }

        if (request.type() != null) {
            artifact.setType(request.type());
        }

        Artifact saved = repository.saveAndFlush(artifact);

        List<RiskCategory> categories = saved.getProject().getConfiguration().getRiskConfig().getCategories();
        long[] f = resolveSingleFindingsSummary(projectId, id);
        long[] r = resolveSingleRisksSummary(projectId, id, categories);

        return mapper.toResponse(
                saved,
                new FindingsSummary((int) f[0], (int) f[1], (int) f[2]),
                new RisksSummary((int) r[0], (int) r[1], (int) r[2])
        );
    }

    @Transactional
    public void delete(UUID projectId, UUID id) {
        Artifact artifact = requireArtifactExists(projectId, id);
        repository.delete(artifact);
    }

    private Map<UUID, long[]> toFindingsMap(List<Object[]> raw) {
        return raw.stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> new long[]{
                                row[1] != null ? ((Number) row[1]).longValue() : 0L,
                                row[2] != null ? ((Number) row[2]).longValue() : 0L,
                                row[3] != null ? ((Number) row[3]).longValue() : 0L
                        }
                ));
    }

    private Map<UUID, long[]> buildRisksMap(List<Object[]> raw, List<RiskCategory> categories) {
        Map<UUID, List<Integer>> levelsByArtifact = new HashMap<>();
        for (Object[] row : raw) {
            UUID artifactId = (UUID) row[0];
            Integer level = row[1] != null ? ((Number) row[1]).intValue() : null;
            if (level != null) {
                levelsByArtifact.computeIfAbsent(artifactId, k -> new ArrayList<>()).add(level);
            }
        }
        Map<UUID, long[]> result = new HashMap<>();
        levelsByArtifact.forEach((artifactId, levels) -> {
            long[] counts = classifyRisks(levels, categories);
            result.put(artifactId, new long[]{counts[2], counts[1], counts[0]});
        });
        return result;
    }

    private long[] resolveSingleFindingsSummary(UUID projectId, UUID artifactId) {
        return repository.findFindingsSummaryByProjectId(projectId)
                .stream()
                .filter(row -> ((UUID) row[0]).equals(artifactId))
                .findFirst()
                .map(row -> new long[]{
                        row[1] != null ? ((Number) row[1]).longValue() : 0L,
                        row[2] != null ? ((Number) row[2]).longValue() : 0L,
                        row[3] != null ? ((Number) row[3]).longValue() : 0L
                })
                .orElse(new long[]{0L, 0L, 0L});
    }

    private long[] resolveSingleRisksSummary(UUID projectId, UUID artifactId, List<RiskCategory> categories) {
        List<Object[]> raw = repository.findRiskLevelsByArtifactAndProjectId(projectId);
        List<Integer> levels = raw.stream()
                .filter(row -> ((UUID) row[0]).equals(artifactId))
                .map(row -> row[1] != null ? ((Number) row[1]).intValue() : null)
                .filter(java.util.Objects::nonNull)
                .toList();
        if (levels.isEmpty()) return new long[]{0L, 0L, 0L};
        long[] counts = classifyRisks(levels, categories);
        return new long[]{counts[2], counts[1], counts[0]};
    }

    private long[] classifyRisks(List<Integer> riskLevels, List<RiskCategory> categories) {
        if (categories.isEmpty() || riskLevels.isEmpty()) return new long[]{0, 0, 0};
        List<RiskCategory> sorted = categories.stream()
                .sorted(Comparator.comparingInt(RiskCategory::getMinRange))
                .toList();
        long low = 0, medium = 0, high = 0;
        for (Integer level : riskLevels) {
            int idx = -1;
            for (int i = 0; i < sorted.size(); i++) {
                RiskCategory cat = sorted.get(i);
                if (level >= cat.getMinRange() && level <= cat.getMaxRange()) {
                    idx = i;
                    break;
                }
            }
            if (idx == 0) low++;
            else if (idx == sorted.size() - 1) high++;
            else if (idx > 0) medium++;
        }
        return new long[]{low, medium, high};
    }

    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Artifact requireArtifactExists(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Artifact", id));
    }
}
