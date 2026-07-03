package wsssguardo.asset.mapper;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.project.Project;

@Component
public class AssetMapper {

    public Asset toEntity(AssetCreateRequestDTO request, Project project) {
        Asset asset = Asset.builder()
                .name(request.name())
                .description(request.description())
                .content(request.content())
                .project(project)
                .build();
        return asset;
    }

    public AssetResponseDTO toResponse(Asset asset) {
        return toResponse(asset, 0L);
    }

    public AssetResponseDTO toResponse(Asset asset, long findingsCount) {
        return new AssetResponseDTO(
                asset.getId(),
                asset.getName(),
                asset.getDescription(),
                asset.getContent(),
                asset.getProject().getId(),
                asset.getCreatedBy(),
                asset.getCreatedAt(),
                asset.getUpdatedAt(),
                findingsCount);
    }

    public AssetPageResponseDTO toPageDTO(Page<Asset> page, Map<UUID, Long> findingCounts) {
        return new AssetPageResponseDTO(
                page.getContent().stream()
                        .map(a -> toResponse(a, findingCounts.getOrDefault(a.getId(), 0L)))
                        .toList(),
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
    public Asset updateEntity(Asset asset, AssetUpdateRequestDTO request) {

        applyName(asset, request.name());
        applyDescription(asset, request.description());
        applyContent(asset, request.content());

        return asset;
    }

    // --- métodos de campo: responsabilidade única, retornam se houve mudança ---

    boolean applyName(Asset asset, String name) {
        if (name == null || name.trim().isBlank()) {
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

}
