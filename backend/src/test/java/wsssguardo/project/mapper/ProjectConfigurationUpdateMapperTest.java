package wsssguardo.project.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.dto.ProjectConfigurationUpdateDTO;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigUpdateDTO;

class ProjectConfigurationUpdateMapperTest {

    private final ProjectConfigurationUpdateMapper mapper = new ProjectConfigurationUpdateMapper();

    @Test
    void updateProjectConfigurationShouldDoNothingWhenRiskConfigIsNull() {
        ProjectConfiguration config = ProjectConfiguration.createDefault();
        Integer originalMin = config.getRiskConfig().getMinRange();

        mapper.updateProjectConfiguration(config, new ProjectConfigurationUpdateDTO(null));

        assertEquals(originalMin, config.getRiskConfig().getMinRange());
    }

    @Test
    void updateProjectConfigurationShouldUpdateMinMaxAndCategories() {
        ProjectConfiguration config = ProjectConfiguration.createDefault();
        RiskConfigUpdateDTO update = RiskConfigUpdateDTO.builder()
                .minRange(2)
                .maxRange(20)
                .categories(List.of(RiskCategoryDTO.builder().label("Novo").minRange(2).maxRange(20).build()))
                .build();

        mapper.updateProjectConfiguration(config, new ProjectConfigurationUpdateDTO(update));

        assertEquals(2, config.getRiskConfig().getMinRange());
        assertEquals(20, config.getRiskConfig().getMaxRange());
        assertEquals(1, config.getRiskConfig().getCategories().size());
        assertEquals("Novo", config.getRiskConfig().getCategories().get(0).getLabel());
    }

    @Test
    void updateProjectConfigurationShouldKeepFieldsWhenPartialUpdate() {
        ProjectConfiguration config = ProjectConfiguration.createDefault();
        RiskConfigUpdateDTO update = RiskConfigUpdateDTO.builder()
                .minRange(5)
                .maxRange(null)
                .categories(null)
                .build();

        mapper.updateProjectConfiguration(config, new ProjectConfigurationUpdateDTO(update));

        assertEquals(5, config.getRiskConfig().getMinRange());
        assertEquals(10, config.getRiskConfig().getMaxRange());
        assertEquals(3, config.getRiskConfig().getCategories().size());
    }
}
