package wsssguardo.asset.dto;

public record AssetUpdateRequestDTO(
    String name,
    String description,
    String content
) {
    
}
