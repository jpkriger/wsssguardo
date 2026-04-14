package wsssguardo.asset.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.AssetResponseDTO;
import wsssguardo.asset.dto.AssetUpdateRequestDTO;

@Component
public class AssetMapper {

    public AssetResponseDTO toResponse(Asset entity) {
        return new AssetResponseDTO(
            entity.getName(),
            entity.getDescription(),
            entity.getContent(),
            entity.getProject().getName()
        );
    }

    public Asset updateEntity(Asset asset, AssetUpdateRequestDTO request) {
        if (request.name() != null) {
            asset.setName(request.name());
        }
        if (request.description() != null) {
            asset.setDescription(request.description());
        }
        if (request.content() != null) {
            asset.setContent(request.content());
        }
        return asset;
    }
    
}
