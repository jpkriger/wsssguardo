package wsssguardo.project.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.project.dto.ProjectConfigurationDTO;
import wsssguardo.project.dto.ProjectConfigurationUpdateDTO;
import wsssguardo.project.service.ProjectConfigurationService;

@Tag(name = "Project Configuration", description = "Endpoints for managing project configurations")
@RestController
@RequestMapping("/api/projects/{projectId}/configuration")
@RequiredArgsConstructor
public class ProjectConfigurationController {

    private final ProjectConfigurationService service;

    @GetMapping
    public ResponseEntity<ProjectConfigurationDTO> getProjectConfiguration(@PathVariable UUID projectId) {
        return ResponseEntity.ok(service.getProjectConfig(projectId));
    }

    @PutMapping
    public ResponseEntity<ProjectConfigurationDTO> updateProjectConfiguration(
            @PathVariable UUID projectId,
            @RequestBody @Valid ProjectConfigurationUpdateDTO dto) {
        return ResponseEntity.ok(service.updateProjectConfig(projectId, dto));
    }
}
