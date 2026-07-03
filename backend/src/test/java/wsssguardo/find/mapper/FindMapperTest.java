package wsssguardo.find.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.find.domain.FindSeverity;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.project.Project;

class FindMapperTest {

    private final FindMapper mapper = new FindMapper();

    @Test
    void toNameResponseShouldMapIdAndName() {
        Find find = new Find();
        find.setId(UUID.randomUUID());
        find.setName("Achado X");

        FindNameResponseDTO dto = mapper.toNameResponse(find);

        assertEquals(find.getId(), dto.id());
        assertEquals("Achado X", dto.name());
    }

    @Test
    void toEntityShouldMapAllFields() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Asset asset = new Asset();
        asset.setId(UUID.randomUUID());
        Artifact artifact = Artifact.builder().build();
        artifact.setId(UUID.randomUUID());

        Find find = mapper.toEntity("Nome", "Desc", 8, FindSeverity.HIGH, "Cat", "Ref",
                project, List.of(asset), List.of(artifact));

        assertEquals("Nome", find.getName());
        assertEquals(FindSeverity.HIGH, find.getCategoricalSeverity());
        assertEquals(project, find.getProject());
        assertEquals(List.of(asset), find.getAssets());
        assertEquals(List.of(artifact), find.getArtifacts());
    }

    @Test
    void toResponseShouldReturnEmptyListsWhenAssetsAndArtifactsAreNull() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Find find = new Find();
        find.setId(UUID.randomUUID());
        find.setName("Achado");
        find.setProject(project);
        find.setAssets(null);
        find.setArtifacts(null);

        FindResponseDTO response = mapper.toResponse(find);

        assertTrue(response.linkedAssetIds().isEmpty());
        assertTrue(response.linkedArtifactIds().isEmpty());
        assertEquals(project.getId(), response.projectId());
    }

    @Test
    void toResponseShouldMapAssetAndArtifactIds() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Asset asset = new Asset();
        asset.setId(UUID.randomUUID());
        Artifact artifact = Artifact.builder().build();
        artifact.setId(UUID.randomUUID());

        Find find = new Find();
        find.setId(UUID.randomUUID());
        find.setName("Achado");
        find.setProject(project);
        find.setAssets(List.of(asset));
        find.setArtifacts(List.of(artifact));

        FindResponseDTO response = mapper.toResponse(find);

        assertEquals(List.of(asset.getId()), response.linkedAssetIds());
        assertEquals(List.of(artifact.getId()), response.linkedArtifactIds());
    }
}
