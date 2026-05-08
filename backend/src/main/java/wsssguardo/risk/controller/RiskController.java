package wsssguardo.risk.controller;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.service.RiskService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequiredArgsConstructor
public class RiskController {

  private final RiskService service;

    @Operation(summary = "Listar riscos por projeto")
    @GetMapping("/project/{projectId}/risks")
    public ResponseEntity<RiskPageResponseDTO> findAllByProject(
            @PathVariable UUID projectId,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
    }
  
}
