package wsssguardo.asset.controller;

import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.service.AssetService;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService service;


/**
 * Parâmetros de paginação (todos opcionais):
 *   - page  : número da página, começa em 0 (padrão: 0)
 *   - size  : quantidade de itens por página (padrão: 20)
 *   - sort  : campo e direção de ordenação (padrão: sem ordenação)
 *
 * Exemplos:
 *   /api/assets/project/uuid-aqui
 *   /api/assets/project/uuid-aqui?page=0&size=10
 *   /api/assets/project/uuid-aqui?page=1&size=10&sort=name,asc
 *   /api/assets/project/uuid-aqui?page=0&size=20&sort=createdAt,desc
 */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<AssetPageResponseDTO> findAllByProject(
            @PathVariable UUID projectId,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
    }
}