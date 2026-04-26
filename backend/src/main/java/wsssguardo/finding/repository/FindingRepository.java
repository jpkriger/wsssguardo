package wsssguardo.finding.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wsssguardo.finding.Finding;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FindingRepository extends JpaRepository<Finding, UUID> {

    List<Finding> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Finding> findByIdAndProjectId(UUID id, UUID projectId);

}
