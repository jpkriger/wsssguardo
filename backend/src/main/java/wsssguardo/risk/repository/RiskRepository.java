package wsssguardo.risk.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.risk.Risk;

public interface RiskRepository extends JpaRepository<Risk, UUID> {
  
}
