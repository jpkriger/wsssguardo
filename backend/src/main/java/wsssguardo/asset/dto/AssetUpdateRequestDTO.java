package wsssguardo.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssetUpdateRequestDTO(

        @NotBlank(message = "name must not be blank when provided") @Size(max = 255, message = "name must not exceed 255 characters") String name,

        @Size(max = 255, message = "description must not exceed 255 characters") String description,

        @Size(max = 255, message = "content must not exceed 255 characters") String content

) {
}
