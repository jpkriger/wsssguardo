package wsssguardo.artifact.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.requestdto.ArtifactUpdateRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.artifact.mapper.ArtifactMapper;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class ArtifactServiceTest {

    @Mock
    private ArtifactRepository repository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ArtifactMapper mapper;

    @InjectMocks
    private ArtifactService service;

    private Project project(UUID id) {
        Project p = new Project();
        p.setId(id);
        p.setConfiguration(ProjectConfiguration.createDefault());
        return p;
    }

    private ArtifactResponseDTO dummyResponse(UUID id) {
        return new ArtifactResponseDTO(id, "name", null, null, null, null, null,
                ArtifactType.NOTE, UUID.randomUUID(), null, null, null, null,
                new ArtifactResponseDTO.FindingsSummary(0, 0, 0),
                new ArtifactResponseDTO.RisksSummary(0, 0, 0));
    }

    @Test
    void listByProjectShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.listByProject(projectId, null));
    }

    @Test
    void listByProjectShouldReturnEmptyListWhenNoArtifacts() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project(projectId)));
        when(repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of());

        List<ArtifactResponseDTO> result = service.listByProject(projectId, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void listByProjectShouldFilterByTypeWhenProvided() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Artifact artifact = Artifact.builder().build();
        artifact.setId(artifactId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project(projectId)));
        when(repository.findAllByProjectIdAndTypeOrderByCreatedAtDesc(projectId, ArtifactType.NOTE))
                .thenReturn(List.of(artifact));
        when(repository.findFindingsSummaryByProjectId(projectId)).thenReturn(List.of());
        when(repository.findGeneralRisksByArtifactAndProjectId(projectId)).thenReturn(List.of());
        when(mapper.toResponse(ArgumentMatchers.eq(artifact), ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(dummyResponse(artifactId));

        List<ArtifactResponseDTO> result = service.listByProject(projectId, ArtifactType.NOTE);

        assertEquals(1, result.size());
        verify(repository).findAllByProjectIdAndTypeOrderByCreatedAtDesc(projectId, ArtifactType.NOTE);
    }

    @Test
    void listByProjectShouldAggregateFindingsAndRisksSummaries() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Artifact artifact = Artifact.builder().build();
        artifact.setId(artifactId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project(projectId)));
        when(repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of(artifact));
        when(repository.findFindingsSummaryByProjectId(projectId))
                .thenReturn(List.<Object[]>of(new Object[]{artifactId, 2L, 1L, 3L}));
        when(repository.findGeneralRisksByArtifactAndProjectId(projectId))
                .thenReturn(List.of(new Object[]{artifactId, 9.0f}, new Object[]{artifactId, 1.0f}));
        when(mapper.toResponse(ArgumentMatchers.eq(artifact), ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(dummyResponse(artifactId));

        List<ArtifactResponseDTO> result = service.listByProject(projectId, null);

        assertEquals(1, result.size());
    }

    @Test
    void createShouldPersistAndReturnResponse() {
        UUID projectId = UUID.randomUUID();
        Project p = project(projectId);
        ArtifactRequestDTO request = new ArtifactRequestDTO("Nome", "desc", "content", "cat", "link", ArtifactType.DOCUMENT);
        Artifact entity = Artifact.builder().name("Nome").build();
        Artifact saved = Artifact.builder().name("Nome").build();
        saved.setId(UUID.randomUUID());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(p));
        when(mapper.toEntity(request, p)).thenReturn(entity);
        when(repository.saveAndFlush(entity)).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(dummyResponse(saved.getId()));

        ArtifactResponseDTO result = service.create(projectId, request);

        assertNotNull(result);
        verify(repository).saveAndFlush(entity);
    }

    @Test
    void createShouldThrowWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                service.create(projectId, new ArtifactRequestDTO("N", null, null, null, null, ArtifactType.NOTE)));
    }

    @Test
    void getByIdShouldReturnResponseWithSummaries() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Project p = project(projectId);
        Artifact artifact = Artifact.builder().project(p).build();
        artifact.setId(artifactId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(p));
        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.findFindingsSummaryByProjectId(projectId))
                .thenReturn(List.<Object[]>of(new Object[]{artifactId, 1L, 0L, 0L}));
        when(repository.findGeneralRisksByArtifactAndProjectId(projectId))
                .thenReturn(List.<Object[]>of(new Object[]{artifactId, 5.0f}));
        when(mapper.toResponse(ArgumentMatchers.eq(artifact), ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(dummyResponse(artifactId));

        ArtifactResponseDTO result = service.getById(projectId, artifactId);

        assertNotNull(result);
    }

    @Test
    void getByIdShouldThrowWhenArtifactNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project(projectId)));
        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(projectId, artifactId));
    }

    @Test
    void updateShouldApplyOnlyProvidedFields() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Project p = project(projectId);
        Artifact artifact = Artifact.builder().project(p).name("Old").build();
        artifact.setId(artifactId);

        ArtifactUpdateRequestDTO request = new ArtifactUpdateRequestDTO(
                "New Name", "New desc", "New content", "New cat", "new-link", ArtifactType.IMAGE);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.saveAndFlush(artifact)).thenReturn(artifact);
        when(repository.findFindingsSummaryByProjectId(projectId)).thenReturn(List.of());
        when(repository.findGeneralRisksByArtifactAndProjectId(projectId)).thenReturn(List.of());
        when(mapper.toResponse(ArgumentMatchers.eq(artifact), ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(dummyResponse(artifactId));

        service.update(projectId, artifactId, request);

        assertEquals("New Name", artifact.getName());
        assertEquals("New desc", artifact.getDescription());
        assertEquals("New content", artifact.getContent());
        assertEquals("New cat", artifact.getCategory());
        assertEquals("new-link", artifact.getDriveLink());
        assertEquals(ArtifactType.IMAGE, artifact.getType());
    }

    @Test
    void updateShouldKeepExistingFieldsWhenRequestFieldsAreNull() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Project p = project(projectId);
        Artifact artifact = Artifact.builder().project(p).name("Old").type(ArtifactType.NOTE).build();
        artifact.setId(artifactId);

        ArtifactUpdateRequestDTO request = new ArtifactUpdateRequestDTO(null, null, null, null, null, null);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.saveAndFlush(artifact)).thenReturn(artifact);
        when(repository.findFindingsSummaryByProjectId(projectId)).thenReturn(List.of());
        when(repository.findGeneralRisksByArtifactAndProjectId(projectId)).thenReturn(List.of());
        when(mapper.toResponse(ArgumentMatchers.eq(artifact), ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(dummyResponse(artifactId));

        service.update(projectId, artifactId, request);

        assertEquals("Old", artifact.getName());
        assertEquals(ArtifactType.NOTE, artifact.getType());
    }

    @Test
    void deleteArtifact_WithLinkedFindings_ThrowsConflict() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Artifact artifact = new Artifact();
        artifact.setId(artifactId);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.existsActiveFindLink(artifactId)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class, () -> service.delete(projectId, artifactId, "testUser"));

        assert (exception.getStatusCode() == HttpStatus.CONFLICT);
        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verify(repository).existsActiveFindLink(artifactId);
        verifyNoInteractions(mapper);
    }

    @Test
    void deleteArtifact_WithoutLinkedFindings_SoftDeletesArtifact() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        String username = "testUser";
        Artifact artifact = new Artifact();
        artifact.setId(artifactId);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.existsActiveFindLink(artifactId)).thenReturn(false);

        service.delete(projectId, artifactId, username);

        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verify(repository).existsActiveFindLink(artifactId);
        assertNotNull(artifact.getDeletedAt());
        assertEquals(username, artifact.getDeletedBy());
        verify(repository).save(artifact);
    }

    @Test
    void deleteArtifact_NotFound_ThrowsNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(projectId, artifactId, "testUser"));
        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verifyNoInteractions(mapper);
    }
}
