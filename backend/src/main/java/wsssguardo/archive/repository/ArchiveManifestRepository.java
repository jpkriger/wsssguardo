package wsssguardo.archive.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.archive.ArchiveManifest;
import wsssguardo.archive.domain.ArchiveStatus;

public interface ArchiveManifestRepository extends JpaRepository<ArchiveManifest, UUID> {

    Optional<ArchiveManifest> findFirstByProjectIdAndStatusOrderByCreatedAtDesc(UUID projectId, ArchiveStatus status);

    Optional<ArchiveManifest> findFirstByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
