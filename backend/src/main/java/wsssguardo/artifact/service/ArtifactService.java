package wsssguardo.artifact.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.requestdto.ArtifactUpdateRequestDTO;
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
    public List<ArtifactResponseDTO> listByProject(UUID projectId, ArtifactType type) {
        requireProjectExists(projectId);

        List<Artifact> results = (type != null)
                ? repository.findAllByProjectIdAndTypeOrderByCreatedAtDesc(projectId, type)
                : repository.findAllByProjectIdOrderByCreatedAtDesc(projectId);

        return results.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ArtifactResponseDTO create(UUID projectId, ArtifactRequestDTO request) {
        Project project = requireProjectExists(projectId);
        Artifact artifact = mapper.toEntity(request, project);

        return mapper.toResponse(repository.saveAndFlush(artifact));
    }

    @Transactional(readOnly = true)
    public ArtifactResponseDTO getById(UUID projectId, UUID id) {
        return mapper.toResponse(requireArtifactExists(projectId, id));
    }

    @Transactional
    public ArtifactResponseDTO update(UUID projectId, UUID id, ArtifactUpdateRequestDTO request) {
        Artifact artifact = requireArtifactExists(projectId, id);
        if (request.name() != null) {
            artifact.setName(request.name());
        }

        if (request.description() != null){
            artifact.setDescription(request.description());
        }
        if (request.content() != null){
            artifact.setContent(request.content());
        }
        if (request.category() != null){
            artifact.setCategory(request.category());
        }

        if (request.driveLink() != null){
            artifact.setDriveLink(request.driveLink());
        }

        if (request.type() != null) {
            artifact.setType(request.type());
        }

        return mapper.toResponse(repository.saveAndFlush(artifact));
    }

    @Transactional
    public void delete(UUID projectId, UUID id) {
        Artifact artifact = requireArtifactExists(projectId, id);
        repository.delete(artifact);
    }


    private Project requireProjectExists(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Artifact requireArtifactExists(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Artifact", id));
    }
}
