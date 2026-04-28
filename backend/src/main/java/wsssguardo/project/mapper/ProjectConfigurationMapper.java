package wsssguardo.project.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.project.dto.ProjectConfigurationDTO;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigDTO;

@Component
public class ProjectConfigurationMapper {
    
    public ProjectConfigurationDTO toProjectConfigurationDTO(ProjectConfiguration projectConfiguration) {
       return ProjectConfigurationDTO.builder()
       .riskConfig(toRiskConfigDTO(projectConfiguration.getRiskConfig()))
       .build();
    }

    public RiskCategoryDTO toRiskCategoryDTO(RiskCategory riskCategory) {
        return RiskCategoryDTO.builder()
        .name(riskCategory.getLabel())
        .minValue(riskCategory.getMinRange())
        .maxValue(riskCategory.getMaxRange())
        .build();
    }

    public RiskConfigDTO toRiskConfigDTO(RiskConfig riskConfig) {
        return RiskConfigDTO.builder()
        .minRange(riskConfig.getMinRange())
        .maxRange(riskConfig.getMaxRange())
        .categories(riskConfig.getCategories().stream().map(this::toRiskCategoryDTO).toList())
        .build();
    }
}
