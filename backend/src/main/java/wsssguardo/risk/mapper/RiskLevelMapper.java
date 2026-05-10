package wsssguardo.risk.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.risk.dto.responsedto.RiskLevelDTO;

@Component
public class RiskLevelMapper {

  private static final int NORMALIZED_MIN = 0;
  private static final int NORMALIZED_MAX = 10_000;

  public RiskLevelDTO toDTO(Integer riskLevel, RiskConfig riskConfig) {
    if (riskLevel == null) {
      return null;
    }

    RiskConfig effective = effectiveConfig(riskConfig);

    int value = scaleToConfiguredRange(riskLevel, effective);
    String label = findLabel(value, effective);

    return new RiskLevelDTO(value, label);
  }

  private RiskConfig effectiveConfig(RiskConfig riskConfig) {
    if (riskConfig == null || riskConfig.getMinRange() == null || riskConfig.getMaxRange() == null) {
      return ProjectConfiguration.createDefault().getRiskConfig();
    }
    return riskConfig;
  }

  private int scaleToConfiguredRange(int riskLevel, RiskConfig config) {
    int clamped = Math.max(NORMALIZED_MIN, Math.min(NORMALIZED_MAX, riskLevel));
    int min = config.getMinRange();
    int max = config.getMaxRange();
    double ratio = (double) (clamped - NORMALIZED_MIN) / (NORMALIZED_MAX - NORMALIZED_MIN);
    return (int) Math.round(min + ratio * (max - min));
  }

  private String findLabel(int value, RiskConfig config) {
    if (config.getCategories() == null) {
      return null;
    }
    return config.getCategories().stream()
        .filter(c -> c.getMinRange() != null && c.getMaxRange() != null)
        .filter(c -> value >= c.getMinRange() && value <= c.getMaxRange())
        .map(RiskCategory::getLabel)
        .findFirst()
        .orElse(null);
  }
}
