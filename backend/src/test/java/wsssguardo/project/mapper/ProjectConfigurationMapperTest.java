package wsssguardo.project.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.project.dto.ProjectConfigurationDTO;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigDTO;

class ProjectConfigurationMapperTest {

    private final ProjectConfigurationMapper mapper = new ProjectConfigurationMapper();

    @Test
    void toProjectConfigurationDTOShouldUseDefaultWhenNull() {
        ProjectConfigurationDTO dto = mapper.toProjectConfigurationDTO(null);

        assertEquals(3, dto.riskConfig().categories().size());
    }

    @Test
    void toProjectConfigurationDTOShouldMapProvidedConfiguration() {
        ProjectConfiguration config = ProjectConfiguration.createDefault();

        ProjectConfigurationDTO dto = mapper.toProjectConfigurationDTO(config);

        assertEquals(0, dto.riskConfig().minRange());
        assertEquals(10, dto.riskConfig().maxRange());
    }

    @Test
    void toRiskCategoryDTOShouldReturnNullWhenInputIsNull() {
        assertNull(mapper.toRiskCategoryDTO(null));
    }

    @Test
    void toRiskCategoryDTOShouldMapFields() {
        RiskCategory category = RiskCategory.builder().label("Alto").minRange(8).maxRange(10).build();

        RiskCategoryDTO dto = mapper.toRiskCategoryDTO(category);

        assertEquals("Alto", dto.label());
        assertEquals(8, dto.minRange());
        assertEquals(10, dto.maxRange());
    }

    @Test
    void toRiskConfigDTOShouldUseDefaultWhenNull() {
        RiskConfigDTO dto = mapper.toRiskConfigDTO(null);

        assertEquals(3, dto.categories().size());
    }

    @Test
    void toRiskConfigDTOShouldMapProvidedConfig() {
        RiskConfig config = RiskConfig.builder()
                .minRange(1)
                .maxRange(9)
                .categories(List.of(RiskCategory.builder().label("X").minRange(1).maxRange(9).build()))
                .build();

        RiskConfigDTO dto = mapper.toRiskConfigDTO(config);

        assertEquals(1, dto.minRange());
        assertEquals(9, dto.maxRange());
        assertEquals(1, dto.categories().size());
    }
}
