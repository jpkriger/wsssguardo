package wsssguardo.asset.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import wsssguardo.asset.Asset;
import wsssguardo.asset.dto.requestdto.AssetCreateRequestDTO;
import wsssguardo.asset.dto.requestdto.AssetUpdateRequestDTO;
import wsssguardo.asset.dto.responsedto.AssetPageResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.mapper.AssetMapper;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository repository;

    @Mock
    private ProjectRepository projectRepository;

    @Spy
    private AssetMapper assetMapper;

    @InjectMocks
    private AssetService service;

    @Test
    void findAllByProjectShouldReturnMappedPage() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);

        Project project = new Project();
        project.setId(projectId);

        Asset asset = Asset.builder()
                .name("Asset A")
                .description("Description A")
                .content("Content A")
                .project(project)
                .build();
        asset.setId(UUID.randomUUID());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        Page<Asset> repositoryPage = new PageImpl<>(List.of(asset), pageable, 1);
        when(repository.findAllByProjectId(projectId, pageable)).thenReturn(repositoryPage);

        AssetPageResponseDTO response = service.findAllByProject(projectId, pageable);

        assertEquals(1, response.content().size());
        assertEquals("Asset A", response.content().get(0).name());
        assertEquals(projectId, response.content().get(0).projectId());
        assertEquals(0, response.page());
        assertEquals(10, response.size());
        assertEquals(1, response.totalElements());
        assertEquals(1, response.totalPages());
        assertTrue(response.first());
        assertTrue(response.last());

        verify(projectRepository).findById(projectId);
        verify(repository).findAllByProjectId(projectId, pageable);
    }

    @Test
    void findAllByProjectShouldReturnEmptyPageWhenNoAssetsFound() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);

        Project project = new Project();
        project.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        Page<Asset> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(repository.findAllByProjectId(projectId, pageable)).thenReturn(emptyPage);

        AssetPageResponseDTO response = service.findAllByProject(projectId, pageable);

        assertEquals(0, response.content().size());
        assertEquals(0, response.totalElements());
        assertEquals(0, response.totalPages());
        assertTrue(response.first());
        assertTrue(response.last());

        verify(projectRepository).findById(projectId);
        verify(repository).findAllByProjectId(projectId, pageable);
    }

    @Test
    void findAllByProjectShouldCorrectlyIndicateMiddlePage() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(1, 2);

        Project project = new Project();
        project.setId(projectId);

        List<Asset> assets = List.of(
                Asset.builder().name("Asset C").project(project).build(),
                Asset.builder().name("Asset D").project(project).build());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        Page<Asset> middlePage = new PageImpl<>(assets, pageable, 6);
        when(repository.findAllByProjectId(projectId, pageable)).thenReturn(middlePage);

        AssetPageResponseDTO response = service.findAllByProject(projectId, pageable);

        assertEquals(1, response.page());
        assertEquals(6, response.totalElements());
        assertEquals(3, response.totalPages());
        assertFalse(response.first());
        assertFalse(response.last());

        verify(projectRepository).findById(projectId);
        verify(repository).findAllByProjectId(projectId, pageable);
    }

    @Test
    void findAllByProjectShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findAllByProject(projectId, pageable));

        verify(projectRepository).findById(projectId);
        verifyNoInteractions(repository);
    }

    @Test
    void createAsset_FoundProject_ReturnsResponse() {
        UUID projectId = UUID.randomUUID();
        String username = "testUser";
        AssetCreateRequestDTO request = new AssetCreateRequestDTO(projectId, "Asset name", "Description", "Content");
        Project project = new Project();
        project.setId(projectId);
        Asset asset = new Asset();
        Asset savedAsset = new Asset();
        AssetResponseDTO expectedResponse = new AssetResponseDTO(UUID.randomUUID(), "Asset name", "Description",
                "Content", projectId, null, null, null);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        doReturn(asset).when(assetMapper).toEntity(request, project, username);
        when(repository.save(asset)).thenReturn(savedAsset);
        doReturn(expectedResponse).when(assetMapper).toResponse(savedAsset);

        AssetResponseDTO actualResponse = service.createAsset(request, username);

        assertEquals(expectedResponse, actualResponse);
        verify(projectRepository).findById(projectId);
        verify(assetMapper).toEntity(request, project, username);
        verify(repository).save(asset);
        verify(assetMapper).toResponse(savedAsset);
    }

    @Test
    void createAsset_ProjectNotFound_ThrowsException() {
        UUID projectId = UUID.randomUUID();
        String username = "testUser";
        AssetCreateRequestDTO request = new AssetCreateRequestDTO(projectId, "Asset name", "Description", "Content");

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.createAsset(request, username));
        verify(projectRepository).findById(projectId);
        verifyNoInteractions(repository);
        verifyNoInteractions(assetMapper);
    }

    @Test
    void updateAsset_Found_ReturnsResponse() {
        UUID id = UUID.randomUUID();
        String username = "testUser";
        AssetUpdateRequestDTO request = new AssetUpdateRequestDTO("name", "description", "type");
        Asset asset = new Asset();
        Asset updatedAsset = new Asset();
        AssetResponseDTO expectedResponse = new AssetResponseDTO(UUID.randomUUID(), "name", "description", "content",
                UUID.randomUUID(), null, null, null);

        when(repository.findById(id)).thenReturn(Optional.of(asset));
        doReturn(updatedAsset).when(assetMapper).updateEntity(asset, request, username);
        doReturn(expectedResponse).when(assetMapper).toResponse(updatedAsset);

        AssetResponseDTO actualResponse = service.updateAsset(id, request, username);

        assertEquals(expectedResponse, actualResponse);
        verify(repository).findById(id);
        verify(assetMapper).updateEntity(asset, request, username);
        verify(assetMapper).toResponse(updatedAsset);
    }

    @Test
    void updateAsset_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        String username = "testUser";
        AssetUpdateRequestDTO request = new AssetUpdateRequestDTO("name", "description", "type");

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateAsset(id, request, username));
        verify(repository).findById(id);
        verifyNoInteractions(assetMapper);
    }

    @Test
    void deleteAsset_Found_DeletesEntity() {
        UUID id = UUID.randomUUID();
        String username = "testUser";
        Asset asset = new Asset();

        when(repository.findById(id)).thenReturn(Optional.of(asset));

        service.deleteAsset(id, username);

        verify(repository).findById(id);
        verify(assetMapper).deleteEntity(asset, username);
    }

    @Test
    void deleteAsset_NotFound_ThrowsException() {
        UUID id = UUID.randomUUID();
        String username = "testUser";

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteAsset(id, username));
        verify(repository).findById(id);
        verifyNoInteractions(assetMapper);
    }
}