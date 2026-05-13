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
        .maxRange(3)
        .build();

    RiskCategory medio = RiskCategory.builder()
        .label("Médio")
        .minRange(4)
        .maxRange(7)
        .build();
        
    RiskCategory alto = RiskCategory.builder()
        .label("Alto")
        .minRange(8)
        .maxRange(10)
        .build();  
        
    RiskConfig riskConfig = RiskConfig.builder()
        .minRange(0)
        .maxRange(10)
        .categories(List.of(baixo, medio, alto))
        .build();    

    return ProjectConfiguration.builder()
        .riskConfig(riskConfig)
        .build();    
  }
}



