package wsssguardo.risk.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.service.RiskService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/risks")
public class RiskController {

  private final RiskService service;

  @Operation(summary = "Criar risco")
  @PostMapping
  public ResponseEntity<RiskResponseDTO> createRisk(@Valid @RequestBody RiskCreateRequestDTO request) {
    var username = "authenticatedUser"; // TODO: Substituir por usuário autenticado (Principal)
    RiskResponseDTO response = service.createRisk(request, username);
    URI location = URI.create("/api/risks/" + response.id());
    return ResponseEntity.created(location).body(response);
  }
  
}
