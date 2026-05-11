package wsssguardo.find.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wsssguardo.find.dto.requestdto.FindRequestDTO;
import wsssguardo.find.dto.requestdto.FindUpdateRequestDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.find.service.FindService;
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
public class FindController {

    private final FindService service;

    @ApiListAll
    @GetMapping("/listByProject/")
    public List<FindResponseDTO> listByProject(@PathVariable UUID projectId) {
        return service.listByProject(projectId);
    }

    @ApiCreate
    @PostMapping("/create/")
    public ResponseEntity<FindResponseDTO> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody FindRequestDTO request) {
        FindResponseDTO created = service.create(projectId, request);
        URI location = URI.create("/api/projects/" + projectId + "/findings/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @ApiGetById
    @GetMapping("/get/{id}")
    public ResponseEntity<FindResponseDTO> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(projectId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FindResponseDTO> update(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody FindUpdateRequestDTO request) {
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
