package wsssguardo.project.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.Project;
import wsssguardo.project.dto.ProjectConfigurationDTO;
import wsssguardo.project.dto.ProjectConfigurationUpdateDTO;
import wsssguardo.project.mapper.ProjectConfigurationMapper;
import wsssguardo.project.mapper.ProjectConfigurationUpdateMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class ProjectConfigurationService {

    private final ProjectRepository repository;
    private final ProjectConfigurationMapper mapper;
    private final ProjectConfigurationUpdateMapper updateMapper;

    public ProjectConfigurationDTO getProjectConfig(UUID projectId) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        return mapper.toProjectConfigurationDTO(project.getConfiguration());
    }

    public ProjectConfigurationDTO updateProjectConfig(UUID projectId, ProjectConfigurationUpdateDTO dto) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        updateMapper.updateProjectConfiguration(project.getConfiguration(), dto);
        repository.save(project);

        return mapper.toProjectConfigurationDTO(project.getConfiguration());
    }
}
