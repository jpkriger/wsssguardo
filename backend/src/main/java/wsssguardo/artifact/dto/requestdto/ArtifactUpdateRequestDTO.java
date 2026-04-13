package wsssguardo.artifact.dto.requestdto;

import jakarta.validation.constraints.Size;
import wsssguardo.artifact.domain.ArtifactType;

public record ArtifactUpdateRequestDTO(

    @Size(max = 255, message = "name must be at most 255 characters")
    String name,

    String description,
    String content,
    String category,
    String driveLink,
    ArtifactType type

) {}
