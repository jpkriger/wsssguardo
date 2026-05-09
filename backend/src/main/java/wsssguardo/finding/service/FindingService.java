package wsssguardo.finding.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.finding.Finding;
import wsssguardo.finding.dto.requestdto.FindingRequestDTO;
import wsssguardo.finding.dto.requestdto.FindingUpdateRequestDTO;
import wsssguardo.finding.dto.responsedto.FindingResponseDTO;
import wsssguardo.finding.mapper.FindingMapper;
import wsssguardo.finding.repository.FindingRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FindingService {

    private final FindingRepository repository;
    private final ProjectRepository projectRepository;
    private final AssetRepository assetRepository;
    private final ArtifactRepository artifactRepository;
    private final FindingMapper mapper;

    @Transactional(readOnly = true)
    public List<FindingResponseDTO> listByProject(UUID projectId) {
        requireProjectExists(projectId);
        return repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public FindingResponseDTO create(UUID projectId, FindingRequestDTO request) {
        Project project = requireProjectExists(projectId);
        Set<Asset> assets = resolveAssets(projectId, request.linkedAssetIds());
        Set<Artifact> artifacts = resolveArtifacts(projectId, request.linkedArtifactIds());
        Finding finding = mapper.toEntity(
                request.name(), request.description(), request.numericSeverity(),
                request.categoricalSeverity(), request.category(), request.reference(),
                project, assets, artifacts);
        return mapper.toResponse(repository.saveAndFlush(finding));
    }

    @Transactional(readOnly = true)
    public FindingResponseDTO getById(UUID projectId, UUID id) {
        return mapper.toResponse(requireFindingExists(projectId, id));
    }

    @Transactional
    public FindingResponseDTO update(UUID projectId, UUID id, FindingUpdateRequestDTO request) {
        Finding finding = requireFindingExists(projectId, id);
        if (request.name() != null) finding.setName(request.name());
        if (request.description() != null) finding.setDescription(request.description());
        if (request.numericSeverity() != null) finding.setNumericSeverity(request.numericSeverity());
        if (request.categoricalSeverity() != null) finding.setCategoricalSeverity(request.categoricalSeverity());
        if (request.category() != null) finding.setCategory(request.category());
        if (request.reference() != null) finding.setReference(request.reference());
        if (request.linkedAssetIds() != null) finding.setLinkedAssets(resolveAssets(projectId, request.linkedAssetIds()));
        if (request.linkedArtifactIds() != null) finding.setLinkedArtifacts(resolveArtifacts(projectId, request.linkedArtifactIds()));
        return mapper.toResponse(repository.saveAndFlush(finding));
    }

    @Transactional
    public void delete(UUID projectId, UUID id) {
        Finding finding = requireFindingExists(projectId, id);
        repository.delete(finding);
    }

    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Finding requireFindingExists(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Finding", id));
    }

    private Set<Asset> resolveAssets(UUID projectId, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Asset> found = assetRepository.findAllByIdInAndProjectId(ids, projectId);
        if (found.size() != ids.size()) {
            Set<UUID> foundIds = found.stream().map(Asset::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ApiException("Assets not found or do not belong to project: " + missing, HttpStatus.BAD_REQUEST);
        }
        return new HashSet<>(found);
    }

    private Set<Artifact> resolveArtifacts(UUID projectId, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Artifact> found = artifactRepository.findAllByIdInAndProjectId(ids, projectId);
        if (found.size() != ids.size()) {
            Set<UUID> foundIds = found.stream().map(Artifact::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ApiException("Artifacts not found or do not belong to project: " + missing, HttpStatus.BAD_REQUEST);
        }
        return new HashSet<>(found);
    }
}
