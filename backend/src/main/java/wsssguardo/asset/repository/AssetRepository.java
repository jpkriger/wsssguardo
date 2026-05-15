package wsssguardo.asset.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.asset.Asset;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Page<Asset> findAllByProjectId(UUID projectId, Pageable pageable);

    List<Asset> findAllByIdInAndProjectId(Collection<UUID> ids, UUID projectId);

    long countByProjectId(UUID projectId);
}
