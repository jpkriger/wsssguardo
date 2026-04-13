package wsssguardo.asset.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;

@Component
public class AssetMapper {

    public static AssetResponseDTO toResponse(Asset asset) {
        return new AssetResponseDTO(
                asset.getId(),
                asset.getName(),
                asset.getDescription(),
                asset.getContent(),
                asset.getProject().getId(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }

    public static AssetPageResponseDTO toPageDTO(Page<Asset> page) {
        return new AssetPageResponseDTO(
                page.getContent().stream().map(AssetMapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
