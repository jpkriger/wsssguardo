package wsssguardo.find.mapper;

import org.springframework.stereotype.Component;
import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.find.domain.FindSeverity;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.project.Project;

import java.util.List;
import java.util.UUID;

@Component
public class FindMapper {

    public Find toEntity(String name, String description, Integer numericSeverity,
                         FindSeverity categoricalSeverity, String category, String reference,
                         Project project, List<Asset> assets, List<Artifact> artifacts) {
        return Find.builder()
                .name(name)
                .description(description)
                .numericSeverity(numericSeverity)
                .categoricalSeverity(categoricalSeverity)
                .category(category)
                .reference(reference)
                .project(project)
                .assets(assets)
                .artifacts(artifacts)
                .build();
    }

    public FindResponseDTO toResponse(Find find) {
        List<UUID> assetIds = find.getAssets() == null ? List.of() :
                find.getAssets().stream().map(Asset::getId).toList();
        List<UUID> artifactIds = find.getArtifacts() == null ? List.of() :
                find.getArtifacts().stream().map(Artifact::getId).toList();
        return new FindResponseDTO(
                find.getId(),
                find.getName(),
                find.getDescription(),
                find.getNumericSeverity(),
                find.getCategoricalSeverity(),
                find.getCategory(),
                find.getReference(),
                find.getProject().getId(),
                assetIds,
                artifactIds,
                find.getCreatedBy(),
                find.getLastModifiedBy(),
                find.getCreatedAt(),
                find.getUpdatedAt()
        );
    }
}
