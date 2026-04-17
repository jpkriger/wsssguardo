package wsssguardo.asset.dto.requestdto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record AssetCreateRequestDTO(

        @NotNull(message = "projectId must not be null") UUID projectId,

        @NotBlank(message = "name must not be blank") @Size(max = 255, message = "name must not exceed 255 characters") String name,

        @Size(max = 255, message = "description must not exceed 255 characters") String description,

        @Size(max = 255, message = "content must not exceed 255 characters") String content

) {
}
