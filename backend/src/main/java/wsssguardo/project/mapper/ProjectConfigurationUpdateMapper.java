package wsssguardo.project.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.project.dto.ProjectConfigurationUpdateDTO;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigUpdateDTO;

@Component
public class ProjectConfigurationUpdateMapper {

    public void updateProjectConfiguration(ProjectConfiguration projectConfiguration,
            ProjectConfigurationUpdateDTO dto) {
        if (dto.riskConfig() != null) {
            updateRiskConfig(projectConfiguration.getRiskConfig(), dto.riskConfig());
        }
    }

    private void updateRiskConfig(RiskConfig riskConfig, RiskConfigUpdateDTO dto) {
        if (dto.minRange() != null)
            riskConfig.setMinRange(dto.minRange());
        if (dto.maxRange() != null)
            riskConfig.setMaxRange(dto.maxRange());
        if (dto.categories() != null) {
            List<RiskCategory> categories = dto.categories().stream()
                    .map(this::toRiskCategory)
                    .toList();
            riskConfig.setCategories(categories);
        }
    }

    private RiskCategory toRiskCategory(RiskCategoryDTO dto) {
        return RiskCategory.builder()
                .label(dto.name())
                .minRange(dto.minValue())
                .maxRange(dto.maxValue())
                .build();
    }
}
