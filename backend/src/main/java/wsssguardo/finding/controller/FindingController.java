package wsssguardo.finding.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wsssguardo.finding.dto.requestdto.FindingRequestDTO;
import wsssguardo.finding.dto.requestdto.FindingUpdateRequestDTO;
import wsssguardo.finding.dto.responsedto.FindingResponseDTO;
import wsssguardo.finding.service.FindingService;
import wsssguardo.shared.openapi.ApiCreate;
import wsssguardo.shared.openapi.ApiGetById;
import wsssguardo.shared.openapi.ApiListAll;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Tag(name = "Findings", description = "Finding operations scoped to a project")
@RestController
@RequestMapping("/api/projects/{projectId}/findings")
@RequiredArgsConstructor
public class FindingController {

    private final FindingService service;

    @ApiListAll
    @GetMapping("/listByProject/")
    public List<FindingResponseDTO> listByProject(@PathVariable UUID projectId) {
        return service.listByProject(projectId);
    }

    @ApiCreate
    @PostMapping("/create/")
    public ResponseEntity<FindingResponseDTO> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody FindingRequestDTO request) {
        FindingResponseDTO created = service.create(projectId, request);
        URI location = URI.create("/api/projects/" + projectId + "/findings/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @ApiGetById
    @GetMapping("/get/{id}")
    public ResponseEntity<FindingResponseDTO> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(projectId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FindingResponseDTO> update(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody FindingUpdateRequestDTO request) {
        return ResponseEntity.ok(service.update(projectId, id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        service.delete(projectId, id);
        return ResponseEntity.noContent().build();
    }
}
