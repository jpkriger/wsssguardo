package wsssguardo.project.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.service.ProjectService;

@RestController
@RequiredArgsConstructor
public class ProjectController {
    
    private final ProjectService service;

}
