package wsssguardo.asset.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.dto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.AssetResponseDTO;
import wsssguardo.asset.service.AssetService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assets")
public class AssetController {
    
    private final AssetService service;


    @PatchMapping("/{id}")
    public ResponseEntity<AssetResponseDTO> updateAsset(@PathVariable UUID id, @RequestBody AssetUpdateRequestDTO request) {
        var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
        return ResponseEntity.ok(service.updateAsset(id, request, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable UUID id) {
        var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
        service.deleteAsset(id, username);
        return ResponseEntity.noContent().build();
    }

}
