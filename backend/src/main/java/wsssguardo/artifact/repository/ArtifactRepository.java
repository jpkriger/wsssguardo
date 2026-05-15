package wsssguardo.artifact.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {

    List<Artifact> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Artifact> findAllByProjectIdAndTypeOrderByCreatedAtDesc(UUID projectId, ArtifactType type);

    Optional<Artifact> findByIdAndProjectId(UUID id, UUID projectId);

    List<Artifact> findAllByIdInAndProjectId(Collection<UUID> ids, UUID projectId);

    long countByProjectId(UUID projectId);

    /**
     * Agrega contagem de findings vinculados a cada artifact do projeto,
     * agrupados por criticidade baseada em categorical_severity:
     * <ul>
     *   <li>high = CRITICAL + HIGH</li>
     *   <li>medium = MEDIUM</li>
     *   <li>low = LOW + INFO</li>
     * </ul>
     */
    @Query(value = """
            SELECT fa.artifacts_id,
                   COALESCE(SUM(CASE WHEN f.categorical_severity IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN f.categorical_severity = 'MEDIUM' THEN 1 ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN f.categorical_severity IN ('LOW', 'INFO') THEN 1 ELSE 0 END), 0)
            FROM finds_artifacts fa
            JOIN finds f ON f.id = fa.find_id
            JOIN artifacts a ON a.id = fa.artifacts_id
            WHERE a.project_id = :projectId AND f.deleted_at IS NULL
            GROUP BY fa.artifacts_id
            """, nativeQuery = true)
    List<Object[]> findFindingsSummaryByProjectId(@Param("projectId") UUID projectId);

    @Query(value = """
            SELECT fa.artifacts_id, r.risk_level
            FROM finds_artifacts fa
            JOIN finds f ON f.id = fa.find_id
            JOIN risks_finds rf ON rf.finds_id = f.id
            JOIN risks r ON r.id = rf.risk_id
            JOIN artifacts a ON a.id = fa.artifacts_id
            WHERE a.project_id = :projectId
              AND f.deleted_at IS NULL
              AND r.deleted_at IS NULL
              AND r.risk_level IS NOT NULL
            """, nativeQuery = true)
    List<Object[]> findRiskLevelsByArtifactAndProjectId(@Param("projectId") UUID projectId);

}
