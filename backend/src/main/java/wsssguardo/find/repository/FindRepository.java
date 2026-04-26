package wsssguardo.find.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.find.Find;

public interface FindRepository extends JpaRepository<Find, UUID> {

    List<Find> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
