package wsssguardo.asset.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.service.AssetService;
import wsssguardo.shared.security.ProjectAccessService;

@ExtendWith(MockitoExtension.class)
class AssetControllerTest {

    @Mock
    private AssetService service;

    @Mock
    private ProjectAccessService projectAccessService;

    private AssetController controller;

    @BeforeEach
    void setUp() {
        controller = new AssetController(service, projectAccessService);
    }

    private AssetResponseDTO dummy(UUID id) {
        return new AssetResponseDTO(id, "n", null, null, UUID.randomUUID(), null, null, null, 0L);
    }

    @Test
    void findAllByProjectShouldAssertAccessAndDelegate() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        AssetPageResponseDTO page = new AssetPageResponseDTO(List.of(dummy(UUID.randomUUID())), 0, 10, 1, 1, true, true);
        when(service.findAllByProject(projectId, pageable)).thenReturn(page);

        ResponseEntity<AssetPageResponseDTO> result = controller.findAllByProject(projectId, pageable);

        assertEquals(200, result.getStatusCode().value());
        verify(projectAccessService).assertAccess(projectId);
    }

    @Test
    void createAssetShouldReturnCreatedWithLocation() {
        UUID projectId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        AssetCreateRequestDTO request = new AssetCreateRequestDTO("n", null, null);
        when(service.createAsset(projectId, request)).thenReturn(dummy(assetId));

        ResponseEntity<AssetResponseDTO> result = controller.createAsset(projectId, request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("/api/projects/" + projectId + "/assets/" + assetId, result.getHeaders().getLocation().toString());
    }

    @Test
    void updateAssetShouldAssertAccessAndReturnOk() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        AssetUpdateRequestDTO request = new AssetUpdateRequestDTO(null, null, null);
        when(service.updateAsset(projectId, id, request)).thenReturn(dummy(id));

        ResponseEntity<AssetResponseDTO> result = controller.updateAsset(projectId, id, request);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void deleteAssetShouldAssertAccessAndCallServiceWithUsername() {
        UUID projectId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(projectAccessService.getUsername()).thenReturn("tester");

        ResponseEntity<Void> result = controller.deleteAsset(projectId, id);

        assertEquals(204, result.getStatusCode().value());
        verify(service).deleteAsset(projectId, id, "tester");
    }
}
