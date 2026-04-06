package wsssguardo.artifact.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.service.ArtifactService;

@RestController
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService service;
    
}
