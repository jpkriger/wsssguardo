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

    /**
     * Agrega contagem de risks vinculados aos findings de cada artifact do projeto,
     * agrupados por faixa de risk_level (normalizado 0-10000):
     * <ul>
     *   <li>high = risk_level > 6666</li>
     *   <li>medium = risk_level BETWEEN 3334 AND 6666</li>
     *   <li>low = risk_level < 3334</li>
     * </ul>
     */
    @Query(value = """
            SELECT fa.artifacts_id,
                   COALESCE(SUM(CASE WHEN r.risk_level > 6666 THEN 1 ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN r.risk_level BETWEEN 3334 AND 6666 THEN 1 ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN r.risk_level < 3334 THEN 1 ELSE 0 END), 0)
            FROM finds_artifacts fa
            JOIN finds f ON f.id = fa.find_id
            JOIN risks_finds rf ON rf.finds_id = f.id
            JOIN risks r ON r.id = rf.risk_id
            JOIN artifacts a ON a.id = fa.artifacts_id
            WHERE a.project_id = :projectId AND f.deleted_at IS NULL AND r.deleted_at IS NULL
            GROUP BY fa.artifacts_id
            """, nativeQuery = true)
    List<Object[]> findRisksSummaryByProjectId(@Param("projectId") UUID projectId);

}
