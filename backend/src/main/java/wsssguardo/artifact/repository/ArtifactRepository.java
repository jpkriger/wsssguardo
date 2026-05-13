package wsssguardo.artifact.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {

    List<Artifact> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Artifact> findAllByProjectIdAndTypeOrderByCreatedAtDesc(UUID projectId, ArtifactType type);

    Optional<Artifact> findByIdAndProjectId(UUID id, UUID projectId);

    List<Artifact> findAllByIdInAndProjectId(Collection<UUID> ids, UUID projectId);

}
