package wsssguardo.risk.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.risk.dto.responsedto.RiskLevelDTO;

class RiskLevelMapperTest {

    private final RiskLevelMapper mapper = new RiskLevelMapper();

    private RiskConfig defaultConfig() {
        return ProjectConfiguration.createDefault().getRiskConfig();
    }

    @Test
    @DisplayName("Should return null when riskLevel is null")
    void toDTO_WhenRiskLevelIsNull_ShouldReturnNull() {
        assertThat(mapper.toDTO(null, defaultConfig())).isNull();
    }

    @Test
    @DisplayName("Should map lower bound 0 to configured min with low category label")
    void toDTO_WhenLowerBound_ShouldReturnConfiguredMin() {
        RiskLevelDTO result = mapper.toDTO(0, defaultConfig());

        assertThat(result).isNotNull();
        assertThat(result.value()).isZero();
        assertThat(result.label()).isEqualTo("Baixo");
    }

    @Test
    @DisplayName("Should map upper bound 10000 to configured max with high category label")
    void toDTO_WhenUpperBound_ShouldReturnConfiguredMax() {
        RiskLevelDTO result = mapper.toDTO(10_000, defaultConfig());

        assertThat(result.value()).isEqualTo(10);
        assertThat(result.label()).isEqualTo("Alto");
    }

    @Test
    @DisplayName("Should map midpoint to middle category")
    void toDTO_WhenMidpoint_ShouldReturnMiddleCategory() {
        RiskLevelDTO result = mapper.toDTO(5_000, defaultConfig());

        assertThat(result.value()).isEqualTo(5);
        assertThat(result.label()).isEqualTo("Médio");
    }

    @Test
    @DisplayName("Should clamp negative values to the configured min")
    void toDTO_WhenBelowNormalizedMin_ShouldClamp() {
        RiskLevelDTO result = mapper.toDTO(-500, defaultConfig());

        assertThat(result.value()).isZero();
        assertThat(result.label()).isEqualTo("Baixo");
    }

    @Test
    @DisplayName("Should clamp values above 10000 to the configured max")
    void toDTO_WhenAboveNormalizedMax_ShouldClamp() {
        RiskLevelDTO result = mapper.toDTO(99_999, defaultConfig());

        assertThat(result.value()).isEqualTo(10);
        assertThat(result.label()).isEqualTo("Alto");
    }

    @Test
    @DisplayName("Should fall back to default config when riskConfig is null")
    void toDTO_WhenConfigIsNull_ShouldUseDefault() {
        RiskLevelDTO result = mapper.toDTO(5_000, null);

        assertThat(result.value()).isEqualTo(5);
        assertThat(result.label()).isEqualTo("Médio");
    }

    @Test
    @DisplayName("Should fall back to default config when minRange is null")
    void toDTO_WhenConfigMinRangeIsNull_ShouldUseDefault() {
        RiskConfig malformed = RiskConfig.builder()
                .minRange(null)
                .maxRange(10)
                .categories(List.of())
                .build();

        RiskLevelDTO result = mapper.toDTO(10_000, malformed);

        assertThat(result.value()).isEqualTo(10);
        assertThat(result.label()).isEqualTo("Alto");
    }

    @Test
    @DisplayName("Should fall back to default config when maxRange is null")
    void toDTO_WhenConfigMaxRangeIsNull_ShouldUseDefault() {
        RiskConfig malformed = RiskConfig.builder()
                .minRange(0)
                .maxRange(null)
                .categories(List.of())
                .build();

        RiskLevelDTO result = mapper.toDTO(0, malformed);

        assertThat(result.value()).isZero();
        assertThat(result.label()).isEqualTo("Baixo");
    }

    @Test
    @DisplayName("Should return null label when categories list is null")
    void toDTO_WhenCategoriesAreNull_ShouldReturnNullLabel() {
        RiskConfig config = RiskConfig.builder()
                .minRange(0)
                .maxRange(100)
                .categories(null)
                .build();

        RiskLevelDTO result = mapper.toDTO(5_000, config);

        assertThat(result.value()).isEqualTo(50);
        assertThat(result.label()).isNull();
    }

    @Test
    @DisplayName("Should return null label when no category covers the scaled value")
    void toDTO_WhenNoCategoryMatches_ShouldReturnNullLabel() {
        RiskCategory only = RiskCategory.builder()
                .label("Apenas Baixo")
                .minRange(0)
                .maxRange(2)
                .build();
        RiskConfig config = RiskConfig.builder()
                .minRange(0)
                .maxRange(10)
                .categories(List.of(only))
                .build();

        RiskLevelDTO result = mapper.toDTO(10_000, config);

        assertThat(result.value()).isEqualTo(10);
        assertThat(result.label()).isNull();
    }

    @Test
    @DisplayName("Should skip categories with null ranges and still find a matching label")
    void toDTO_WhenCategoryHasNullRange_ShouldSkipAndMatchOther() {
        RiskCategory invalid = RiskCategory.builder()
                .label("Invalida")
                .minRange(null)
                .maxRange(null)
                .build();
        RiskCategory valid = RiskCategory.builder()
                .label("Crítico")
                .minRange(0)
                .maxRange(10)
                .build();
        RiskConfig config = RiskConfig.builder()
                .minRange(0)
                .maxRange(10)
                .categories(List.of(invalid, valid))
                .build();

        RiskLevelDTO result = mapper.toDTO(5_000, config);

        assertThat(result.label()).isEqualTo("Crítico");
    }

    @Test
    @DisplayName("Should respect a custom configured range")
    void toDTO_WhenCustomRange_ShouldScaleAccordingly() {
        RiskConfig config = RiskConfig.builder()
                .minRange(0)
                .maxRange(100)
                .categories(List.of(
                        RiskCategory.builder().label("Low").minRange(0).maxRange(33).build(),
                        RiskCategory.builder().label("Mid").minRange(34).maxRange(66).build(),
                        RiskCategory.builder().label("High").minRange(67).maxRange(100).build()
                ))
                .build();

        assertThat(mapper.toDTO(0, config).value()).isZero();
        assertThat(mapper.toDTO(0, config).label()).isEqualTo("Low");
        assertThat(mapper.toDTO(5_000, config).value()).isEqualTo(50);
        assertThat(mapper.toDTO(5_000, config).label()).isEqualTo("Mid");
        assertThat(mapper.toDTO(10_000, config).value()).isEqualTo(100);
        assertThat(mapper.toDTO(10_000, config).label()).isEqualTo("High");
    }
}
