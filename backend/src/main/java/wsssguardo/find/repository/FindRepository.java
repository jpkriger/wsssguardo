package wsssguardo.find.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wsssguardo.find.Find;

import java.util.Optional;

public interface FindRepository extends JpaRepository<Find, UUID> {

    List<Find> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Find> findByIdAndProjectId(UUID id, UUID projectId);

    long countByProjectId(UUID projectId);

    @Query(value = """
            SELECT EXISTS (
              SELECT 1 FROM risks_finds rf
              JOIN risks r ON r.id = rf.risk_id
              WHERE rf.finds_id = :findId
                AND r.deleted_at IS NULL
            )
            """, nativeQuery = true)
    boolean existsActiveRiskLink(@Param("findId") UUID findId);
}
