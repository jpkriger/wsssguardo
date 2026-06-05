package wsssguardo.asset.controller;

import java.net.URI;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.service.AssetService;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.shared.security.ProjectAccessService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{projectId}/assets")
@Tag(name = "Assets", description = "Assets operations")
public class AssetController {

    private final AssetService service;
    private final ProjectAccessService projectAccessService;
    private final AuthenticatedUser authenticatedUser;

    @Operation(summary = "Listar ativos por projeto")
    @GetMapping
    public ResponseEntity<AssetPageResponseDTO> findAllByProject(
            @PathVariable UUID projectId,
            @ParameterObject Pageable pageable) {
        projectAccessService.assertAccess(projectId);
        return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
    }

    @Operation(summary = "Criar novo ativo")
    @PostMapping
    public ResponseEntity<AssetResponseDTO> createAsset(
            @PathVariable UUID projectId,
            @Valid @RequestBody AssetCreateRequestDTO request) {
        projectAccessService.assertAccess(projectId);
        String createdBy = authenticatedUser.get().getEmail();
        AssetResponseDTO response = service.createAsset(projectId, request, createdBy);
        URI location = URI.create("/api/projects/" + projectId + "/assets/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Atualizar ativo")
    @PatchMapping("/{id}")
    public ResponseEntity<AssetResponseDTO> updateAsset(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody AssetUpdateRequestDTO request) {
        projectAccessService.assertAccess(projectId);
        String updatedBy = authenticatedUser.get().getEmail();
        return ResponseEntity.ok(service.updateAsset(projectId, id, request, updatedBy));
    }

    @Operation(summary = "Excluir ativo")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        projectAccessService.assertAccess(projectId);
        String deletedBy = authenticatedUser.get().getEmail();
        service.deleteAsset(projectId, id, deletedBy);
        return ResponseEntity.noContent().build();
    }
}
