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

    // --- Export de arquivamento (inclui tombstones; ignora o @SQLRestriction) ---

    @Query(value = "SELECT * FROM finds WHERE project_id = :projectId", nativeQuery = true)
    List<Find> findAllByProjectIdIncludingDeleted(@Param("projectId") UUID projectId);

    /** Pares [find_id, assets_id] de todos os finds do projeto. */
    @Query(value = """
            SELECT fa.find_id, fa.assets_id
            FROM finds_assets fa
            JOIN finds f ON f.id = fa.find_id
            WHERE f.project_id = :projectId
            """, nativeQuery = true)
    List<Object[]> findAssetLinksByProjectId(@Param("projectId") UUID projectId);

    /** Pares [find_id, artifacts_id] de todos os finds do projeto. */
    @Query(value = """
            SELECT fa.find_id, fa.artifacts_id
            FROM finds_artifacts fa
            JOIN finds f ON f.id = fa.find_id
            WHERE f.project_id = :projectId
            """, nativeQuery = true)
    List<Object[]> findArtifactLinksByProjectId(@Param("projectId") UUID projectId);

    /** Pares [find_id, categories_id] de todos os finds do projeto. */
    @Query(value = """
            SELECT fc.find_id, fc.categories_id
            FROM finds_categories fc
            JOIN finds f ON f.id = fc.find_id
            WHERE f.project_id = :projectId
            """, nativeQuery = true)
    List<Object[]> findCategoryLinksByProjectId(@Param("projectId") UUID projectId);
}
