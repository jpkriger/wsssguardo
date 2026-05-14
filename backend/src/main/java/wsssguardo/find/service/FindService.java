package wsssguardo.find.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.find.Find;
import wsssguardo.find.dto.requestdto.FindRequestDTO;
import wsssguardo.find.dto.requestdto.FindUpdateRequestDTO;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.find.mapper.FindMapper;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FindService {

    private final FindRepository repository;
    private final ProjectRepository projectRepository;
    private final AssetRepository assetRepository;
    private final ArtifactRepository artifactRepository;
    private final FindMapper mapper;

    @Transactional(readOnly = true)
    public List<FindResponseDTO> listByProject(UUID projectId) {
        requireProjectExists(projectId);
        return repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public FindResponseDTO create(UUID projectId, FindRequestDTO request) {
        Project project = requireProjectExists(projectId);
        List<Asset> assets = resolveAssets(projectId, request.linkedAssetIds());
        List<Artifact> artifacts = resolveArtifacts(projectId, request.linkedArtifactIds());
        Find find = mapper.toEntity(
                request.name(), request.description(), request.numericSeverity(),
                request.categoricalSeverity(), request.category(), request.reference(),
                project, assets, artifacts);
        return mapper.toResponse(repository.saveAndFlush(find));
    }

    @Transactional(readOnly = true)
    public FindResponseDTO getById(UUID projectId, UUID id) {
        return mapper.toResponse(requireFindExists(projectId, id));
    }

    @Transactional
    public FindResponseDTO update(UUID projectId, UUID id, FindUpdateRequestDTO request) {
        Find find = requireFindExists(projectId, id);
        if (request.name() != null) find.setName(request.name());
        if (request.description() != null) find.setDescription(request.description());
        if (request.numericSeverity() != null) find.setNumericSeverity(request.numericSeverity());
        if (request.categoricalSeverity() != null) find.setCategoricalSeverity(request.categoricalSeverity());
        if (request.category() != null) find.setCategory(request.category());
        if (request.reference() != null) find.setReference(request.reference());
        if (request.linkedAssetIds() != null) find.setAssets(resolveAssets(projectId, request.linkedAssetIds()));
        if (request.linkedArtifactIds() != null) find.setArtifacts(resolveArtifacts(projectId, request.linkedArtifactIds()));
        return mapper.toResponse(repository.saveAndFlush(find));
    }

    @Transactional
    public void delete(UUID projectId, UUID id) {
        Find find = requireFindExists(projectId, id);
        repository.delete(find);
    }

    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Find requireFindExists(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Find", id));
    }

    private List<Asset> resolveAssets(UUID projectId, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<Asset> found = assetRepository.findAllByIdInAndProjectId(ids, projectId);
        if (found.size() != ids.size()) {
            Set<UUID> foundIds = found.stream().map(Asset::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ApiException("Assets not found or do not belong to project: " + missing, HttpStatus.BAD_REQUEST);
        }
        return found;
    }

    private List<Artifact> resolveArtifacts(UUID projectId, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<Artifact> found = artifactRepository.findAllByIdInAndProjectId(ids, projectId);
        if (found.size() != ids.size()) {
            Set<UUID> foundIds = found.stream().map(Artifact::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ApiException("Artifacts not found or do not belong to project: " + missing, HttpStatus.BAD_REQUEST);
        }
        return found;
    }

    @Transactional(readOnly = true)
    public List<FindNameResponseDTO> getFindingNameByProjectId(UUID projectId) {
        requireProjectExists(projectId);

        return repository.findAllByProjectIdOrderByCreatedAtDesc(projectId).stream()
            .map(mapper::toNameResponse)
            .toList();
    }
}
