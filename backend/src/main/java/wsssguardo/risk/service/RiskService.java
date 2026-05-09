package wsssguardo.risk.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.risk.repository.RiskRepository;

@Service
@RequiredArgsConstructor
public class RiskService {
  
  private final RiskRepository repository;

}
