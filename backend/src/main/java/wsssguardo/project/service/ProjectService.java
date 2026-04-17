package wsssguardo.project.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.Project;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository repository;
    private final ProjectMapper mapper;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listAllProjects() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> projectsById(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Map<UUID, Project> projectsById = repository.findAllById(ids).stream()
            .collect(Collectors.toMap(Project::getId, Function.identity()));

        return ids.stream()
            .map(projectsById::get)
            .filter(Objects::nonNull)
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> projectsByUserId(UUID userId) {
        if (userId == null) {
            return List.of();
        }

        return repository.findProjectIdsByUserId(userId);
    }
}
