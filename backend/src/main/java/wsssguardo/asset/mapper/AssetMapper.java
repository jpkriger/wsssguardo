package wsssguardo.asset.mapper;

import java.time.LocalDateTime;

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

    public Asset updateEntity(Asset asset, AssetUpdateRequestDTO request, String username) {
        var changed = false;
        if (request.name() != null) {
            asset.setName(request.name());
            changed = true;
        }
        if (request.description() != null) {
            asset.setDescription(request.description());
            changed = true;
        }
        if (request.content() != null) {
            asset.setContent(request.content());
            changed = true;
        }
        if (changed) {
            asset.setUpdatedAt(LocalDateTime.now());
            asset.setLastModifiedBy(username);
        }
        return asset;
    }

    public void deleteEntity(Asset asset, String deletedBy) {
        asset.setDeletedAt(LocalDateTime.now());
        asset.setDeletedBy(deletedBy);
    }
    
}
