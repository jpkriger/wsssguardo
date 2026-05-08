package wsssguardo.risk.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.service.RiskService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskController {

  private final RiskService service;

  @Operation(summary = "Update a risk")
  @PutMapping("/{id}")
  public ResponseEntity<Risk> update(
      @PathVariable UUID id,
      @RequestBody @Valid RiskCreateRequestDTO dto) {

    return ResponseEntity.ok(service.update(id, dto));
  }

  @Operation(summary = "Delete a risk")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable UUID id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}