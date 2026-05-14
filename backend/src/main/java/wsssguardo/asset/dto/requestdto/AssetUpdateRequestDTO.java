package wsssguardo.asset.dto.requestdto;

import jakarta.validation.constraints.Size;

public record AssetUpdateRequestDTO(

        @Size(max = 255, message = "name must not exceed 255 characters") String name,

        @Size(max = 255, message = "description must not exceed 255 characters") String description,

        @Size(max = 255, message = "content must not exceed 255 characters") String content

) {
}
