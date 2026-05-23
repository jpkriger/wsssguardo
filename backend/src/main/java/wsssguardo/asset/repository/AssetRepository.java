package wsssguardo.asset.repository;

import java.util.Collection;
import java.util.List;
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

}
