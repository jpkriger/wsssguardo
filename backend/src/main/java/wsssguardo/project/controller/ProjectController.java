package wsssguardo.project.controller;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.service.ProjectService;
import wsssguardo.shared.openapi.ApiListAll;

@Tag(name = "Project", description = "Project operations")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService service;

    @Operation(summary = "Find projects by IDs")
    @GetMapping(params = "!userId")
    public List<ProjectResponse> projectsById(@RequestParam(required = false) List<UUID> ids) {
        return service.projectsById(ids);
    }

    @ApiListAll
    @GetMapping(params = "userId")
    public ResponseEntity<List<UUID>> projectsByUserId(@RequestParam UUID userId) {
        return ResponseEntity.ok(service.projectsByUserId(userId));
    }
}
