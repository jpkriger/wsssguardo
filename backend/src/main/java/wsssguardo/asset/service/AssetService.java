package wsssguardo.asset.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.mapper.AssetMapper;
import java.util.UUID;
import jakarta.transaction.Transactional;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.project.repository.ProjectRepository;
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
        return assetMapper.toPageDTO(page);
    }

    @Transactional
    public AssetResponseDTO createAsset(AssetCreateRequestDTO request, String username) {
        var project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", request.projectId()));

        Asset asset = assetMapper.toEntity(request, project, username);
        asset = repository.save(asset);

        return assetMapper.toResponse(asset);
    }

    @Transactional
    public AssetResponseDTO updateAsset(UUID id, AssetUpdateRequestDTO request, String username) {
        var asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", id));

        asset = assetMapper.updateEntity(asset, request, username);

        return assetMapper.toResponse(asset);
    }

    @Transactional
    public void deleteAsset(UUID id, String username) {
        var asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", id));

        assetMapper.deleteEntity(asset, username);
    }

}
