package wsssguardo.artifact.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.artifact.Artifact;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {

    List<Artifact> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

}
