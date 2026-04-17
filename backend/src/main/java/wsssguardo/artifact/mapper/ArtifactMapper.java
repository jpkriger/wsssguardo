package wsssguardo.artifact.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.project.Project;

@Component
public class ArtifactMapper {

    public Artifact toEntity(ArtifactRequestDTO request, Project project) {
        return Artifact.builder()
                .name(request.name())
                .description(request.description())
                .content(request.content())
                .category(request.category())
                .driveLink(request.driveLink())
                .type(request.type())
                .project(project)
                .build();
    }

    public ArtifactResponseDTO toResponse(Artifact artifact) {
        return new ArtifactResponseDTO(
                artifact.getId(),
                artifact.getName(),
                artifact.getDescription(),
                artifact.getContent(),
                artifact.getCategory(),
                artifact.getDriveLink(),
                artifact.getLlmSummary(),
                artifact.getType(),
                artifact.getProject().getId(),
                artifact.getCreatedBy(),
                artifact.getLastModifiedBy(),
                artifact.getCreatedAt(),
                artifact.getUpdatedAt()
        );
    }
}
