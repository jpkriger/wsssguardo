package wsssguardo.project.domain.projectConfiguration;

import java.io.IOException;
import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectConfiguration implements Serializable {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private RiskConfig riskConfig;

  // H2 2.x devolve colunas jsonb via rs.getString() envoltas em aspas duplas,
  // fazendo o Jackson receber token STRING em vez de OBJECT. Este creator re-parseia.
  @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
  public static ProjectConfiguration fromJsonString(String json) throws IOException {
    return MAPPER.readValue(json, ProjectConfiguration.class);
  }

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



