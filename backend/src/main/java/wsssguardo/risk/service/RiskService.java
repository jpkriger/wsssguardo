package wsssguardo.risk.service;

import java.util.UUID;

import org.springframework.data.domain.Pageable;

import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

public interface RiskService {
  RiskResponseDTO createRisk(RiskCreateRequestDTO request, String username);

  RiskPageResponseDTO findAllByProject(UUID projectId, Pageable pageable);

  RiskResponseDTO update(UUID id, RiskUpdateRequestDTO dto);

  void delete(UUID id);
}
