package wsssguardo.project.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class ProjectService {
    
    private final ProjectRepository repository;

}
