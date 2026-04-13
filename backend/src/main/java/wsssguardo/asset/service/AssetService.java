package wsssguardo.asset.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.mapper.AssetMapper;
import wsssguardo.asset.repository.AssetRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository repository;

    public AssetPageResponseDTO findAllByProject(UUID projectId, Pageable pageable) {
    Page<Asset> page = repository.findAllByProjectId(projectId, pageable);
    return AssetMapper.toPageDTO(page);
}
}