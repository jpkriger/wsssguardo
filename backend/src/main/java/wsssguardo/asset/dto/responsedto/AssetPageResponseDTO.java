package wsssguardo.asset.dto.responsedto;

import java.util.List;

public record AssetPageResponseDTO(
        List<AssetResponseDTO> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {}