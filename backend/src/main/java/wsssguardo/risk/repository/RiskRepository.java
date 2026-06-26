package wsssguardo.risk.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.EntityGraph;
import wsssguardo.risk.Risk;

public interface RiskRepository extends JpaRepository<Risk, UUID> {

    @EntityGraph(attributePaths = {"finds"})
    Optional<Risk> findByIdAndProjectId(UUID id, UUID projectId);

    Page<Risk> findAllByProjectId(UUID projectId, Pageable pageable);

    long countByProjectId(UUID projectId);

    @Query("SELECT r.generalRisk FROM Risk r WHERE r.project.id = :projectId AND r.generalRisk IS NOT NULL")
    List<Float> findGeneralRisksByProjectId(@Param("projectId") UUID projectId);

    // --- Export de arquivamento (inclui tombstones; ignora o @SQLRestriction) ---

    @Query(value = "SELECT * FROM risks WHERE project_id = :projectId", nativeQuery = true)
    List<Risk> findAllByProjectIdIncludingDeleted(@Param("projectId") UUID projectId);

    /** Pares [risk_id, finds_id] de todos os riscos do projeto (dono da M2M risks_finds). */
    @Query(value = """
            SELECT rf.risk_id, rf.finds_id
            FROM risks_finds rf
            JOIN risks r ON r.id = rf.risk_id
            WHERE r.project_id = :projectId
            """, nativeQuery = true)
    List<Object[]> findFindLinksByProjectId(@Param("projectId") UUID projectId);
}
