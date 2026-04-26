package wsssguardo.finding.dto.requestdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import wsssguardo.finding.domain.FindingSeverity;

import java.util.List;
import java.util.UUID;

public record FindingRequestDTO(

        @NotBlank(message = "name must not be blank")
        @Size(max = 255, message = "name must be at most 255 characters")
        String name,

        String description,

        Integer numericSeverity,

        FindingSeverity categoricalSeverity,

        @Size(max = 255, message = "category must be at most 255 characters")
        String category,

        @Size(max = 255, message = "reference must be at most 255 characters")
        String reference,

        List<UUID> linkedAssetIds,

        List<UUID> linkedArtifactIds

) {}
