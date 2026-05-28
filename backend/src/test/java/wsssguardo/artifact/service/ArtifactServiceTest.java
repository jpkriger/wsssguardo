package wsssguardo.artifact.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.mapper.ArtifactMapper;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.project.Project;
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

    @Test
    void deleteArtifact_WithLinkedFindings_ThrowsConflict() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Artifact artifact = new Artifact();
        artifact.setId(artifactId);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.existsActiveFindLink(artifactId)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class, () -> service.delete(projectId, artifactId));

        assert (exception.getStatusCode() == HttpStatus.CONFLICT);
        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verify(repository).existsActiveFindLink(artifactId);
        verifyNoInteractions(mapper);
    }

    @Test
    void deleteArtifact_WithoutLinkedFindings_DeletesArtifact() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();
        Artifact artifact = new Artifact();
        artifact.setId(artifactId);

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.of(artifact));
        when(repository.existsActiveFindLink(artifactId)).thenReturn(false);

        service.delete(projectId, artifactId);

        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verify(repository).existsActiveFindLink(artifactId);
        verify(repository).delete(artifact);
    }

    @Test
    void deleteArtifact_NotFound_ThrowsNotFound() {
        UUID projectId = UUID.randomUUID();
        UUID artifactId = UUID.randomUUID();

        when(repository.findByIdAndProjectId(artifactId, projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(projectId, artifactId));
        verify(repository).findByIdAndProjectId(artifactId, projectId);
        verifyNoInteractions(mapper);
    }
}
