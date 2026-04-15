package wsssguardo.asset.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.dto.AssetUpdateRequestDTO;
import java.time.LocalDateTime;

@Component
public class AssetMapper {

    public AssetResponseDTO toResponse(Asset asset) {
        return new AssetResponseDTO(
                asset.getId(),
                asset.getName(),
                asset.getDescription(),
                asset.getContent(),
                asset.getProject().getId(),
                asset.getCreatedBy(),
                asset.getCreatedAt(),
                asset.getUpdatedAt());
    }

    public AssetPageResponseDTO toPageDTO(Page<Asset> page) {
        return new AssetPageResponseDTO(
                page.getContent().stream().map(this::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }

    /**
     * Aplica os campos presentes no request ao asset (PATCH semântico).
     * Cada campo é delegado a um método próprio para permitir reuso e teste
     * isolado.
     * Atualiza auditoria apenas se ao menos um campo foi alterado.
     */
    public Asset updateEntity(Asset asset, AssetUpdateRequestDTO request, String username) {
        boolean changed = false;

        changed |= applyName(asset, request.name());
        changed |= applyDescription(asset, request.description());
        changed |= applyContent(asset, request.content());

        if (changed) {
            applyAudit(asset, username);
        }

        return asset;
    }

    public void deleteEntity(Asset asset, String deletedBy) {
        asset.setDeletedAt(LocalDateTime.now());
        asset.setDeletedBy(deletedBy);
    }

    // --- métodos de campo: responsabilidade única, retornam se houve mudança ---

    boolean applyName(Asset asset, String name) {
        if (name == null) {
            return false;
        }
        asset.setName(name);
        return true;
    }

    boolean applyDescription(Asset asset, String description) {
        if (description == null) {
            return false;
        }
        asset.setDescription(description);
        return true;
    }

    boolean applyContent(Asset asset, String content) {
        if (content == null) {
            return false;
        }
        asset.setContent(content);
        return true;
    }

    void applyAudit(Asset asset, String username) {
        asset.setUpdatedAt(LocalDateTime.now());
        asset.setLastModifiedBy(username);
    }
}
