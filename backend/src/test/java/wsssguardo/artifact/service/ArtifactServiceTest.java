package wsssguardo.artifact.service;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.mapper.ArtifactMapper;
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class ArtifactServiceTest {

    @Mock
    private ArtifactRepository repository;

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
