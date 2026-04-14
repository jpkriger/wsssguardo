package wsssguardo.project.controller;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.dto.responsedto.ProjectDocumentResponseDTO;
import wsssguardo.project.service.ProjectService;

@Tag(name = "Project", description = "Project operations")
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService service;

    @GetMapping("/{projectId}/documents")
    public List<ProjectDocumentResponseDTO> documentsByProjectId(@PathVariable UUID projectId) {
        return service.documentsByProjectId(projectId);
    }

}
