package wsssguardo.risk.service;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.Project;
import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class RiskService {

  private final RiskRepository repository;
  private final ProjectRepository projectRepository;
  private final RiskMapper riskMapper;

  public RiskPageResponseDTO findAllByProject(UUID projectId, Pageable pageable) {
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    return riskMapper.toPageDTO(repository.findAllByProjectId(projectId, pageable), resolveRiskConfig(project));
  }

  private RiskConfig resolveRiskConfig(Project project) {
    ProjectConfiguration configuration = project.getConfiguration() != null
        ? project.getConfiguration()
        : ProjectConfiguration.createDefault();
    RiskConfig riskConfig = configuration.getRiskConfig();
    return riskConfig != null
        ? riskConfig
        : ProjectConfiguration.createDefault().getRiskConfig();
  }

}
