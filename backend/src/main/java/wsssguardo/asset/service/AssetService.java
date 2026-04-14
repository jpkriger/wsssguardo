package wsssguardo.asset.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import wsssguardo.asset.dto.AssetUpdateRequestDTO;
import wsssguardo.asset.mapper.AssetMapper;
import wsssguardo.asset.dto.AssetResponseDTO;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository repository;
    private final AssetMapper assetMapper;

    @Transactional
    public AssetResponseDTO updateAsset(UUID id, AssetUpdateRequestDTO request) {
        var asset = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", id));

        asset = assetMapper.updateEntity(asset, request);

        return assetMapper.toResponse(asset);
    }
    
}
