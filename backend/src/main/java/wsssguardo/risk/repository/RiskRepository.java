package wsssguardo.risk.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.risk.Risk;

public interface RiskRepository extends JpaRepository<Risk, UUID> {

    Page<Risk> findAllByProjectId(UUID projectId, Pageable pageable);
  
}
