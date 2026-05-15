package wsssguardo.project.domain.projectConfiguration;

import java.io.Serializable;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectConfiguration implements Serializable {

  private RiskConfig riskConfig;

  public static ProjectConfiguration createDefault() {
    RiskCategory baixo = RiskCategory.builder()
        .label("Baixo")
        .minRange(0)
        .maxRange(32)
        .build();

    RiskCategory medio = RiskCategory.builder()
        .label("Médio")
        .minRange(33)
        .maxRange(65)
        .build();

    RiskCategory alto = RiskCategory.builder()
        .label("Alto")
        .minRange(66)
        .maxRange(100)
        .build();

    RiskConfig riskConfig = RiskConfig.builder()
        .minRange(0)
        .maxRange(100)
        .categories(List.of(baixo, medio, alto))
        .build();

    return ProjectConfiguration.builder()
        .riskConfig(riskConfig)
        .build();
  }
}



