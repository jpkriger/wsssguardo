package wsssguardo.artifact.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.service.ArtifactService;
import wsssguardo.shared.openapi.ApiCreate;
import wsssguardo.shared.openapi.ApiListAll;

@Tag(name = "Artifacts", description = "Artifact operations scoped to a project")
@RestController
@RequestMapping("/api/projects/{projectId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService service;

    @ApiListAll
    @GetMapping("/listByProject/")
    public List<ArtifactResponseDTO> listByProject(@PathVariable UUID projectId) {
        return service.listByProject(projectId);
    }

    @ApiCreate
    @PostMapping("/create/")
    public ResponseEntity<ArtifactResponseDTO> create(@PathVariable UUID projectId, @Valid @RequestBody ArtifactRequestDTO request) {

        ArtifactResponseDTO created = service.create(projectId, request);
        URI location = URI.create("/api/projects/" + projectId + "/artifacts/" + created.id());
        return ResponseEntity.created(location).body(created);
    }
}
