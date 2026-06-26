package wsssguardo.asset.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.mapper.AssetMapper;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetMapper assetMapper;
    private final AssetRepository repository;
    private final ProjectRepository projectRepository;

    public AssetPageResponseDTO findAllByProject(UUID projectId, Pageable pageable) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        Page<Asset> page = repository.findAllByProjectId(projectId, pageable);
        Map<UUID, Long> findingCounts = buildFindingCountsMap(repository.findFindingsCountByProjectId(projectId));
        return assetMapper.toPageDTO(page, findingCounts);
    }

    private Map<UUID, Long> buildFindingCountsMap(List<Object[]> raw) {
        return raw.stream().collect(Collectors.toMap(
                row -> (UUID) row[0],
                row -> row[1] != null ? ((Number) row[1]).longValue() : 0L
        ));
    }

    @Transactional
    public AssetResponseDTO createAsset(UUID projectId, AssetCreateRequestDTO request) {
        var project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Asset asset = assetMapper.toEntity(request, project);
        asset = repository.save(asset);

        return assetMapper.toResponse(asset);
    }

    @Transactional
    public AssetResponseDTO updateAsset(UUID projectId, UUID id, AssetUpdateRequestDTO request) {
        var asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", id));
        if (!asset.getProject().getId().equals(projectId)) {
            throw new ApiException("Asset does not belong to the given project", HttpStatus.NOT_FOUND);
        }

        asset = assetMapper.updateEntity(asset, request);

        return assetMapper.toResponse(asset);
    }

    @Transactional
    public void deleteAsset(UUID projectId, UUID id, String username) {
        var asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", id));
        if (!asset.getProject().getId().equals(projectId)) {
            throw new ApiException("Asset does not belong to the given project", HttpStatus.NOT_FOUND);
        }

        if (repository.existsActiveFindLink(id)) {
            throw new ApiException("Asset has linked findings and cannot be deleted", HttpStatus.CONFLICT);
        }

        asset.softDelete(username);
        repository.save(asset);
    }

}
