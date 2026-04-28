package wsssguardo.project.domain.projectConfiguration;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RiskCategory {
  
  private String label;

  private Integer minRange;

  private Integer maxRange;

}
