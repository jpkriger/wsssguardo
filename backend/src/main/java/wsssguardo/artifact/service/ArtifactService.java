package wsssguardo.artifact.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.repository.ArtifactRepository;

@Service
@RequiredArgsConstructor
public class ArtifactService {
    
    private final ArtifactRepository repository;

}
