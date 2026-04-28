package wsssguardo.project.domain.projectConfiguration;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RiskConfig {

  private Integer minRange;

  private Integer maxRange;

  private List<RiskCategory> categories;
  
}
