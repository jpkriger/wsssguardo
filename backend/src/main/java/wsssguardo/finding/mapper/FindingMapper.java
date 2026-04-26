package wsssguardo.finding.mapper;

import org.springframework.stereotype.Component;
import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.finding.Finding;
import wsssguardo.finding.dto.responsedto.FindingResponseDTO;
import wsssguardo.project.Project;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class FindingMapper {

    public Finding toEntity(String name, String description, Integer numericSeverity,
                            wsssguardo.finding.domain.FindingSeverity categoricalSeverity,
                            String category, String reference,
                            Project project, Set<Asset> assets, Set<Artifact> artifacts) {
        return Finding.builder()
                .name(name)
                .description(description)
                .numericSeverity(numericSeverity)
                .categoricalSeverity(categoricalSeverity)
                .category(category)
                .reference(reference)
                .project(project)
                .linkedAssets(assets)
                .linkedArtifacts(artifacts)
                .build();
    }

    public FindingResponseDTO toResponse(Finding finding) {
        List<UUID> assetIds = finding.getLinkedAssets().stream()
                .map(Asset::getId)
                .toList();
        List<UUID> artifactIds = finding.getLinkedArtifacts().stream()
                .map(Artifact::getId)
                .toList();
        return new FindingResponseDTO(
                finding.getId(),
                finding.getName(),
                finding.getDescription(),
                finding.getNumericSeverity(),
                finding.getCategoricalSeverity(),
                finding.getCategory(),
                finding.getReference(),
                finding.getProject().getId(),
                assetIds,
                artifactIds,
                finding.getCreatedBy(),
                finding.getLastModifiedBy(),
                finding.getCreatedAt(),
                finding.getUpdatedAt()
        );
    }
}
