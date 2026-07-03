package wsssguardo.find.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.find.Find;
import wsssguardo.find.dto.requestdto.FindRequestDTO;
import wsssguardo.find.dto.requestdto.FindUpdateRequestDTO;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.find.mapper.FindMapper;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class FindServiceTest {

    @Mock
    private FindRepository repository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private FindMapper mapper;

    @InjectMocks
    private FindService service;

    private FindResponseDTO dummyResponse(UUID id) {
        return new FindResponseDTO(id, "name", null, null, null, null, null,
                UUID.randomUUID(), List.of(), List.of(), null, null, null, null);
    }

    @Test
    void getFindingNameByProjectIdShouldReturnMappedFindingNames() {
        UUID projectId = UUID.randomUUID();
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        Find olderFind = find(firstId, "Achado anterior");
        Find newerFind = find(secondId, "Achado recente");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of(
                newerFind,
                olderFind));
        when(mapper.toNameResponse(newerFind)).thenReturn(new FindNameResponseDTO(secondId, "Achado recente"));
        when(mapper.toNameResponse(olderFind)).thenReturn(new FindNameResponseDTO(firstId, "Achado anterior"));

        List<FindNameResponseDTO> response = service.getFindingNameByProjectId(projectId);

        assertEquals(2, response.size());
        assertEquals(secondId, response.get(0).id());
        assertEquals("Achado recente", response.get(0).name());
        assertEquals(firstId, response.get(1).id());
        assertEquals("Achado anterior", response.get(1).name());
        verify(projectRepository).findById(projectId);
        verify(repository).findAllByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Test
    void deleteFind_WithLinkedRisks_ThrowsConflict() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        Find find = find(findId, "Achado");

        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.of(find));
        when(repository.existsActiveRiskLink(findId)).thenReturn(true);

        assertThrows(ApiException.class, () -> service.delete(projectId, findId, "testUser"));

        verify(repository).findByIdAndProjectId(findId, projectId);
        verify(repository).existsActiveRiskLink(findId);
    }

    @Test
    void deleteFind_NoLinkedRisks_SoftDeletesEntity() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        String username = "testUser";
        Project project = new Project();
        project.setId(projectId);
        Find find = find(findId, "Achado");

        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.of(find));
        when(repository.existsActiveRiskLink(findId)).thenReturn(false);

        service.delete(projectId, findId, username);

        verify(repository).findByIdAndProjectId(findId, projectId);
        verify(repository).existsActiveRiskLink(findId);
        assertNotNull(find.getDeletedAt());
        assertEquals(username, find.getDeletedBy());
        verify(repository).save(find);
    }

    @Test
    void getFindingNameByProjectIdShouldThrowWhenProjectDoesNotExist() {
        UUID projectId = UUID.randomUUID();

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getFindingNameByProjectId(projectId));
        verify(projectRepository).findById(projectId);
        verifyNoInteractions(repository);
    }

    @Test
    void listByProjectShouldReturnMappedFinds() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        Find find = find(UUID.randomUUID(), "Achado");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of(find));
        when(mapper.toResponse(find)).thenReturn(dummyResponse(find.getId()));

        List<FindResponseDTO> result = service.listByProject(projectId);

        assertEquals(1, result.size());
    }

    @Test
    void listByProjectShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.listByProject(projectId));
    }

    @Test
    void createShouldResolveAssetsArtifactsAndPersist() {
        UUID projectId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        Asset asset = new Asset();
        asset.setId(assetId);
        Artifact artifact = Artifact.builder().build();
        artifact.setId(artifactId);
        Find entity = find(UUID.randomUUID(), "Nome");

        FindRequestDTO request = new FindRequestDTO("Nome", "Desc", 5, null, "Cat", "Ref",
                List.of(assetId), List.of(artifactId));

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(assetRepository.findAllByIdInAndProjectId(List.of(assetId), projectId)).thenReturn(List.of(asset));
        when(artifactRepository.findAllByIdInAndProjectId(List.of(artifactId), projectId)).thenReturn(List.of(artifact));
        when(mapper.toEntity("Nome", "Desc", 5, null, "Cat", "Ref", project, List.of(asset), List.of(artifact)))
                .thenReturn(entity);
        when(repository.saveAndFlush(entity)).thenReturn(entity);
        when(mapper.toResponse(entity)).thenReturn(dummyResponse(entity.getId()));

        FindResponseDTO response = service.create(projectId, request);

        assertNotNull(response);
    }

    @Test
    void createShouldThrowWhenAssetsMissing() {
        UUID projectId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        FindRequestDTO request = new FindRequestDTO("Nome", null, null, null, null, null,
                List.of(assetId), List.of());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(assetRepository.findAllByIdInAndProjectId(List.of(assetId), projectId)).thenReturn(List.of());

        assertThrows(ApiException.class, () -> service.create(projectId, request));
    }

    @Test
    void createShouldThrowWhenArtifactsMissing() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        FindRequestDTO request = new FindRequestDTO("Nome", null, null, null, null, null,
                List.of(), List.of(artifactId));

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(artifactRepository.findAllByIdInAndProjectId(List.of(artifactId), projectId)).thenReturn(List.of());

        assertThrows(ApiException.class, () -> service.create(projectId, request));
    }

    @Test
    void getByIdShouldReturnMappedResponse() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        Find find = find(findId, "Achado");

        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.of(find));
        when(mapper.toResponse(find)).thenReturn(dummyResponse(findId));

        FindResponseDTO response = service.getById(projectId, findId);

        assertNotNull(response);
    }

    @Test
    void getByIdShouldThrowWhenNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(projectId, findId));
    }

    @Test
    void updateShouldApplyAllProvidedFields() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Find find = find(findId, "Old");
        Asset asset = new Asset();
        asset.setId(assetId);
        Artifact artifact = Artifact.builder().build();
        artifact.setId(artifactId);

        FindUpdateRequestDTO request = new FindUpdateRequestDTO(
                "New", "New Desc", 9, wsssguardo.find.domain.FindSeverity.CRITICAL, "NewCat", "NewRef",
                List.of(assetId), List.of(artifactId));

        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.of(find));
        when(assetRepository.findAllByIdInAndProjectId(List.of(assetId), projectId)).thenReturn(List.of(asset));
        when(artifactRepository.findAllByIdInAndProjectId(List.of(artifactId), projectId)).thenReturn(List.of(artifact));
        when(repository.saveAndFlush(find)).thenReturn(find);
        when(mapper.toResponse(find)).thenReturn(dummyResponse(findId));

        service.update(projectId, findId, request);

        assertEquals("New", find.getName());
        assertEquals("New Desc", find.getDescription());
        assertEquals(9, find.getNumericSeverity());
        assertEquals(wsssguardo.find.domain.FindSeverity.CRITICAL, find.getCategoricalSeverity());
        assertEquals(List.of(asset), find.getAssets());
        assertEquals(List.of(artifact), find.getArtifacts());
    }

    @Test
    void updateShouldKeepFieldsWhenRequestFieldsNull() {
        UUID projectId = UUID.randomUUID();
        UUID findId = UUID.randomUUID();
        Find find = find(findId, "Old");

        FindUpdateRequestDTO request = new FindUpdateRequestDTO(
                null, null, null, null, null, null, null, null);

        when(repository.findByIdAndProjectId(findId, projectId)).thenReturn(Optional.of(find));
        when(repository.saveAndFlush(find)).thenReturn(find);
        when(mapper.toResponse(find)).thenReturn(dummyResponse(findId));

        service.update(projectId, findId, request);

        assertEquals("Old", find.getName());
    }

    private static Find find(UUID id, String name) {
        Find find = new Find();
        find.setId(id);
        find.setName(name);
        find.setCreatedAt(LocalDateTime.now());
        return find;
    }
}
