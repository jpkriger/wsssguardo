package wsssguardo.find.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wsssguardo.find.Find;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FindRepository extends JpaRepository<Find, UUID> {

    List<Find> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Find> findByIdAndProjectId(UUID id, UUID projectId);

}
