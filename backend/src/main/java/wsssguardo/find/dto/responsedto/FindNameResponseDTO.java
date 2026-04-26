package wsssguardo.find.dto.responsedto;

import java.util.UUID;

public record FindNameResponseDTO(
    UUID id,
    String name
) {}
