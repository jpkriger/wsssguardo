package wsssguardo.asset.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import wsssguardo.asset.Asset;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Page<Asset> findAllByProjectId(UUID projectId, Pageable pageable);

    List<Asset> findAllByIdInAndProjectId(Collection<UUID> ids, UUID projectId);

    long countByProjectId(UUID projectId);

    @Query(value = """
            SELECT EXISTS (
              SELECT 1 FROM finds_assets fa
              JOIN finds f ON f.id = fa.find_id
              WHERE fa.assets_id = :assetId
                AND f.deleted_at IS NULL
            )
            """, nativeQuery = true)
    boolean existsActiveFindLink(@Param("assetId") UUID assetId);

    @Query(value = """
            SELECT fa.assets_id, COUNT(fa.find_id)
            FROM finds_assets fa
            JOIN finds f ON f.id = fa.find_id
            JOIN assets a ON a.id = fa.assets_id
            WHERE a.project_id = :projectId
              AND f.deleted_at IS NULL
            GROUP BY fa.assets_id
            """, nativeQuery = true)
    List<Object[]> findFindingsCountByProjectId(@Param("projectId") UUID projectId);

    Optional<Asset> findByIdAndProjectId(UUID id, UUID projectId);

    // Export de arquivamento: inclui tombstones (ignora o @SQLRestriction do BaseEntity).
    @Query(value = "SELECT * FROM assets WHERE project_id = :projectId", nativeQuery = true)
    List<Asset> findAllByProjectIdIncludingDeleted(@Param("projectId") UUID projectId);
}
