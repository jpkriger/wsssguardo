package wsssguardo.project.domain.projectConfiguration;

import lombok.Data;

@Data
public class RiskCategory {
  
  private String label;

  private Integer minRange;

  private Integer maxRange;

}
