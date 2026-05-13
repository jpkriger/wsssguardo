package wsssguardo.risk.controller;

import java.net.URI;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.service.RiskService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RiskController {

  private final RiskService service;

  @Operation(summary = "Criar risco")
  @PostMapping("/risks")
  public ResponseEntity<RiskResponseDTO> createRisk(@Valid @RequestBody RiskCreateRequestDTO request) {
    var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
    RiskResponseDTO response = service.createRisk(request, username);
    URI location = URI.create("/api/risks/" + response.id());
    return ResponseEntity.created(location).body(response);
  }

  @Operation(summary = "Listar riscos por projeto")
  @GetMapping("/project/{project-id}/risks")
  public ResponseEntity<RiskPageResponseDTO> findAllByProject(
      @PathVariable("project-id") UUID projectId,
      @ParameterObject Pageable pageable) {
    return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
  }

  @Operation(summary = "Update a risk")
  @PutMapping("/risks/{id}")
  public ResponseEntity<RiskResponseDTO> update(
      @PathVariable UUID id,
      @RequestBody @Valid RiskUpdateRequestDTO dto) {
    return ResponseEntity.ok(service.update(id, dto));
  }

  @Operation(summary = "Delete a risk")
  @DeleteMapping("/risks/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
