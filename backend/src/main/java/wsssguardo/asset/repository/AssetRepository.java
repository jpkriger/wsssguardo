package wsssguardo.asset.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.asset.Asset;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    
}
