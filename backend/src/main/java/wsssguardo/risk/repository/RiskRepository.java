package wsssguardo.risk.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import wsssguardo.risk.Risk;

public interface RiskRepository extends JpaRepository<Risk, UUID> {

    Page<Risk> findAllByProjectId(UUID projectId, Pageable pageable);

    long countByProjectId(UUID projectId);

    @Query("SELECT r.riskLevel FROM Risk r WHERE r.project.id = :projectId AND r.riskLevel IS NOT NULL")
    List<Integer> findRiskLevelsByProjectId(@Param("projectId") UUID projectId);
}
