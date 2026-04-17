package wsssguardo.artifact.dto.requestdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import wsssguardo.artifact.domain.ArtifactType;

public record ArtifactRequestDTO(

    @NotBlank(message = "name must not be blank")
    @Size(max = 255, message = "name must be at most 255 characters")
    String name,

    String description,

    String content,

    String category,

    String driveLink,

    @NotNull(message = "type must not be null")
    ArtifactType type

) {}
