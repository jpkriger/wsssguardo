package wsssguardo.asset.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.asset.dto.AssetResponseDTO;
import wsssguardo.asset.dto.AssetUpdateRequestDTO;
import wsssguardo.asset.mapper.AssetMapper;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.asset.Asset;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository repository;

    @Mock
    private AssetMapper assetMapper;

    @InjectMocks
    private AssetService service;

    @Test
    void updateAsset_Found_ReturnsResponse() {
        UUID id = UUID.randomUUID();
        AssetUpdateRequestDTO request = new AssetUpdateRequestDTO("name", "description", "type");
        Asset asset = new Asset();
        Asset updatedAsset = new Asset();
        AssetResponseDTO expectedResponse = new AssetResponseDTO("id", "name", "description", "type");

        when(repository.findById(id)).thenReturn(Optional.of(asset));
        when(assetMapper.updateEntity(asset, request)).thenReturn(updatedAsset);
        when(assetMapper.toResponse(updatedAsset)).thenReturn(expectedResponse);

        AssetResponseDTO actualResponse = service.updateAsset(id, request);

        assertEquals(expectedResponse, actualResponse);
        verify(repository).findById(id);
        verify(assetMapper).updateEntity(asset, request);
        verify(assetMapper).toResponse(updatedAsset);
    }

    @Test
    void updateAsset_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        AssetUpdateRequestDTO request = new AssetUpdateRequestDTO("name", "description", "type");

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateAsset(id, request));
        verify(repository).findById(id);
        verifyNoInteractions(assetMapper);
    }
}
