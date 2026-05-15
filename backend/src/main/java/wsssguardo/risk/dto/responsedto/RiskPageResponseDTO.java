package wsssguardo.risk.dto.responsedto;

import java.util.List;

public record RiskPageResponseDTO(
    List<RiskResponseDTO> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
}
