package wsssguardo.risk.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ApiException;

@Service
@RequiredArgsConstructor
public class RiskService {

  private final RiskRepository repository;
  private final FindRepository findRepository;
  private final AssetRepository assetRepository;
  private final RiskMapper mapper;

  @Transactional
  public RiskResponseDTO update(UUID id, RiskUpdateRequestDTO dto) {
    Risk risk = repository.findById(id)
      .orElseThrow(() -> new ApiException("Risk not found with id: " + id, HttpStatus.NOT_FOUND));

    List<Find> finds = dto.findIds() != null
        ? findRepository.findAllById(dto.findIds())
        : null;
    List<Asset> assets = dto.assetIds() != null
      ? assetRepository.findAllById(dto.assetIds())
        : null;

    risk = mapper.updateEntity(risk, dto, finds, assets, null);

    return mapper.toResponse(repository.save(risk));
  }

  @Transactional
    public void delete(UUID id) {
    if (!repository.existsById(id)) {
      throw new ApiException("Risk not found with id: " + id, HttpStatus.NOT_FOUND);
    }
    repository.deleteById(id); // soft delete automático
  }
}
