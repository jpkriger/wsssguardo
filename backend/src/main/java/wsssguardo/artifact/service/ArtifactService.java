package wsssguardo.artifact.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.mapper.ArtifactMapper;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    private final ArtifactRepository repository;
    private final ProjectRepository projectRepository;
    private final ArtifactMapper mapper;

    @Transactional(readOnly = true)
    public List<ArtifactResponseDTO> listByProject(UUID projectId) {
        requireProjectExists(projectId);
        return repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ArtifactResponseDTO create(UUID projectId, ArtifactRequestDTO request) {
        Project project = requireProjectExists(projectId);
        Artifact artifact = mapper.toEntity(request, project);

        return mapper.toResponse(repository.saveAndFlush(artifact));
    }


    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }
}
