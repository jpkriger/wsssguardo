package wsssguardo.artifact.service;

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
        requireProjectExists(projectId);

        List<Artifact> results = (type != null)
                ? repository.findAllByProjectIdAndTypeOrderByCreatedAtDesc(projectId, type)
                : repository.findAllByProjectIdOrderByCreatedAtDesc(projectId);

        if (results.isEmpty()) {
            return List.of();
        }

        Map<UUID, long[]> findingsMap = toMap(repository.findFindingsSummaryByProjectId(projectId));
        Map<UUID, long[]> risksMap = toMap(repository.findRisksSummaryByProjectId(projectId));

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
        Artifact artifact = requireArtifactExists(projectId, id);

        long[] f = resolveSingleFindingsSummary(projectId, id);
        long[] r = resolveSingleRisksSummary(projectId, id);

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

        long[] f = resolveSingleFindingsSummary(projectId, id);
        long[] r = resolveSingleRisksSummary(projectId, id);

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

    /**
     * Converte o resultado de uma query de agregação (List<Object[]>) em um
     * Map<UUID, long[]> onde cada long[] = [high, medium, low].
     */
    private Map<UUID, long[]> toMap(List<Object[]> raw) {
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

    /**
     * Resolve o findings summary para um único artifact usando as mesmas queries
     * de agregação, filtrando pelo artifact específico.
     */
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

    /**
     * Resolve o risks summary para um único artifact usando as mesmas queries
     * de agregação, filtrando pelo artifact específico.
     */
    private long[] resolveSingleRisksSummary(UUID projectId, UUID artifactId) {
        return repository.findRisksSummaryByProjectId(projectId)
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

    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Artifact requireArtifactExists(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Artifact", id));
    }
}
