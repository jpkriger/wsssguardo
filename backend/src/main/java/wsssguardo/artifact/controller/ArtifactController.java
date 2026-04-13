package wsssguardo.artifact.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.requestdto.ArtifactUpdateRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.service.ArtifactService;
import wsssguardo.shared.openapi.ApiCreate;
import wsssguardo.shared.openapi.ApiGetById;
import wsssguardo.shared.openapi.ApiListAll;

@Tag(name = "Artifacts", description = "Artifact operations scoped to a project")
@RestController
@RequestMapping("/api/projects/{projectId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService service;

    @ApiListAll
    @GetMapping("/listByProject/")
    public List<ArtifactResponseDTO> listByProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) ArtifactType type) {
        return service.listByProject(projectId, type);
    }

    @ApiCreate
    @PostMapping("/create/")
    public ResponseEntity<ArtifactResponseDTO> create(@PathVariable UUID projectId, @Valid @RequestBody ArtifactRequestDTO request) {

        ArtifactResponseDTO created = service.create(projectId, request);
        URI location = URI.create("/api/projects/" + projectId + "/artifacts/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @ApiGetById
    @GetMapping("/get/{id}")
    public ResponseEntity<ArtifactResponseDTO> getById(@PathVariable UUID projectId, @PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(projectId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArtifactResponseDTO> update(@PathVariable UUID projectId, @PathVariable UUID id,
                                                      @Valid @RequestBody ArtifactUpdateRequestDTO request) {

        return ResponseEntity.ok(service.update(projectId, id, request));
    }
}
