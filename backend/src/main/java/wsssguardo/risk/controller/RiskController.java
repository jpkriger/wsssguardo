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
import wsssguardo.risk.dto.responsedto.RiskSummaryDTO;
import wsssguardo.risk.service.RiskService;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.shared.security.ProjectAccessService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequestMapping("/api/projects/{projectId}/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService service;
    private final ProjectAccessService projectAccessService;
    private final AuthenticatedUser authenticatedUser;

    @Operation(summary = "Listar riscos por projeto")
    @GetMapping
    public ResponseEntity<RiskPageResponseDTO> findAllByProject(
            @PathVariable UUID projectId,
            @ParameterObject Pageable pageable) {
        projectAccessService.assertAccess(projectId);
        return ResponseEntity.ok(service.findAllByProject(projectId, pageable));
    }

    @Operation(summary = "Resumo de riscos por projeto")
    @GetMapping("/summary")
    public ResponseEntity<RiskSummaryDTO> getRiskSummary(@PathVariable UUID projectId) {
        projectAccessService.assertAccess(projectId);
        return ResponseEntity.ok(service.getRiskSummary(projectId));
    }

    @Operation(summary = "Criar risco")
    @PostMapping
    public ResponseEntity<RiskResponseDTO> createRisk(
            @PathVariable UUID projectId,
            @Valid @RequestBody RiskCreateRequestDTO request) {
        projectAccessService.assertAccess(projectId);
        String createdBy = authenticatedUser.get().getEmail();
        RiskResponseDTO response = service.createRisk(projectId, request, createdBy);
        URI location = URI.create("/api/projects/" + projectId + "/risks/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Atualizar risco")
    @PutMapping("/{id}")
    public ResponseEntity<RiskResponseDTO> update(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @RequestBody @Valid RiskUpdateRequestDTO dto) {
        projectAccessService.assertAccess(projectId);
        return ResponseEntity.ok(service.update(projectId, id, dto));
    }

    @Operation(summary = "Deletar risco")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        projectAccessService.assertAccess(projectId);
        service.delete(projectId, id);
        return ResponseEntity.noContent().build();
    }
}
