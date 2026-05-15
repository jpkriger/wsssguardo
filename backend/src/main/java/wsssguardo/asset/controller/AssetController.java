package wsssguardo.asset.controller;

import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;

import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.service.AssetService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assets")
@Tag(name = "Assets", description = "Assets operations")
public class AssetController {

    private final AssetService service;

    @Operation(summary = "Listar ativos por projeto")
    @GetMapping("/project/{projectId}")
    public ResponseEntity<AssetPageResponseDTO> findAllByProject(
            @PathVariable UUID projectId,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
    }

    @Operation(summary = "Atualizar ativo")
    @PatchMapping("/{id}")
    public ResponseEntity<AssetResponseDTO> updateAsset(@PathVariable UUID id,
            @Valid @RequestBody AssetUpdateRequestDTO request) {
        var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
        return ResponseEntity.ok(service.updateAsset(id, request, username));
    }

    @Operation(summary = "Criar novo ativo")
    @PostMapping
    public ResponseEntity<AssetResponseDTO> createAsset(
            @Valid @RequestBody AssetCreateRequestDTO request) {
        var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
        AssetResponseDTO response = service.createAsset(request, username);
        URI location = URI.create("/api/assets/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Excluir ativo")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable UUID id) {
        var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
        service.deleteAsset(id, username);
        return ResponseEntity.noContent().build();
    }

}
