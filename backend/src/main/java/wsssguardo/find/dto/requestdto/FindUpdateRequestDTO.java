package wsssguardo.find.dto.requestdto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Size;
import wsssguardo.find.domain.FindSeverity;

public record FindUpdateRequestDTO(

        @Size(max = 255, message = "name must be at most 255 characters")
        String name,

        String description,

        Integer numericSeverity,

        FindSeverity categoricalSeverity,

        @Size(max = 255, message = "category must be at most 255 characters")
        String category,

        @Size(max = 255, message = "reference must be at most 255 characters")
        String reference,

        @Size(min = 1, message = "At least one asset is required")
        List<UUID> linkedAssetIds,

        @Size(min = 1, message = "At least one artifact is required")
        List<UUID> linkedArtifactIds

) {}
