package wsssguardo.asset.controller;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.service.AssetService;

@Tag(name = "Asset", description = "Asset operations")
@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {
    
    private final AssetService service;

    @GetMapping("/project/{projectId}/ativos")
    public List<AssetResponseDTO> ativosByProjectId(@PathVariable UUID projectId) {
        return service.ativosByProjectId(projectId);
    }

}
