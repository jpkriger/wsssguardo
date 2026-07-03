package wsssguardo.asset.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.project.Project;

class AssetMapperTest {

    private final AssetMapper mapper = new AssetMapper();

    private Project project() {
        Project p = new Project();
        p.setId(UUID.randomUUID());
        return p;
    }

    @Test
    void toEntityShouldMapFields() {
        AssetCreateRequestDTO request = new AssetCreateRequestDTO("Nome", "Desc", "Content");
        Project project = project();

        Asset asset = mapper.toEntity(request, project);

        assertEquals("Nome", asset.getName());
        assertEquals(project, asset.getProject());
    }

    @Test
    void toResponseWithoutCountShouldDefaultToZero() {
        Asset asset = Asset.builder().name("N").project(project()).build();
        asset.setId(UUID.randomUUID());

        AssetResponseDTO response = mapper.toResponse(asset);

        assertEquals(0L, response.findingsCount());
    }

    @Test
    void toResponseWithCountShouldMapAllFields() {
        Project project = project();
        Asset asset = Asset.builder().name("N").description("D").content("C").project(project).build();
        asset.setId(UUID.randomUUID());

        AssetResponseDTO response = mapper.toResponse(asset, 5L);

        assertEquals(5L, response.findingsCount());
        assertEquals(project.getId(), response.projectId());
    }

    @Test
    void toPageDTOShouldMapCountsFromMapAndDefaultMissingToZero() {
        Project project = project();
        Asset asset1 = Asset.builder().name("A1").project(project).build();
        asset1.setId(UUID.randomUUID());
        Asset asset2 = Asset.builder().name("A2").project(project).build();
        asset2.setId(UUID.randomUUID());

        Map<UUID, Long> counts = Map.of(asset1.getId(), 3L);
        var page = new PageImpl<>(List.of(asset1, asset2), PageRequest.of(0, 10), 2);

        AssetPageResponseDTO result = mapper.toPageDTO(page, counts);

        assertEquals(2, result.content().size());
        assertEquals(3L, result.content().get(0).findingsCount());
        assertEquals(0L, result.content().get(1).findingsCount());
    }

    @Test
    void updateEntityShouldApplyProvidedFields() {
        Asset asset = Asset.builder().name("Old").description("OldDesc").content("OldContent").build();

        mapper.updateEntity(asset, new AssetUpdateRequestDTO("New", "NewDesc", "NewContent"));

        assertEquals("New", asset.getName());
        assertEquals("NewDesc", asset.getDescription());
        assertEquals("NewContent", asset.getContent());
    }

    @Test
    void applyNameShouldReturnFalseWhenNullOrBlank() {
        Asset asset = Asset.builder().name("Keep").build();

        assertFalse(mapper.applyName(asset, null));
        assertFalse(mapper.applyName(asset, "   "));
        assertEquals("Keep", asset.getName());
    }

    @Test
    void applyNameShouldSetWhenValid() {
        Asset asset = Asset.builder().name("Old").build();

        assertTrue(mapper.applyName(asset, "New"));
        assertEquals("New", asset.getName());
    }

    @Test
    void applyDescriptionShouldReturnFalseWhenNull() {
        Asset asset = Asset.builder().description("Keep").build();

        assertFalse(mapper.applyDescription(asset, null));
        assertEquals("Keep", asset.getDescription());
    }

    @Test
    void applyContentShouldReturnFalseWhenNull() {
        Asset asset = Asset.builder().content("Keep").build();

        assertFalse(mapper.applyContent(asset, null));
        assertEquals("Keep", asset.getContent());
    }
}
