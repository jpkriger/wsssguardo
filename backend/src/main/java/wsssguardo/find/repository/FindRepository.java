package wsssguardo.find.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import wsssguardo.find.Find;

import java.util.Optional;

public interface FindRepository extends JpaRepository<Find, UUID> {

    List<Find> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Find> findByIdAndProjectId(UUID id, UUID projectId);

}
