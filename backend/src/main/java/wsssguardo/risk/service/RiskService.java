package wsssguardo.risk.service;

import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

public interface RiskService {
  RiskResponseDTO createRisk(RiskCreateRequestDTO request, String username);
}
