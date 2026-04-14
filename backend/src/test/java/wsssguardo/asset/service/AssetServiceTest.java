package wsssguardo.asset.service;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.asset.dto.responsedto.AssetResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class AssetServiceTest {

    @Test
    void ativosByProjectIdReturnsMockedAssets() {
        AssetService service = new AssetService(null);

        UUID projectId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        List<AssetResponseDTO> assets = service.ativosByProjectId(projectId);

        assertFalse(assets.isEmpty(), "Expected mocked assets to be returned");
        assertEquals(3, assets.size());
        assertEquals(projectId.toString(), assets.get(0).projectId());
        assertEquals("Servidor de Backup", assets.get(0).name());
    }
}
