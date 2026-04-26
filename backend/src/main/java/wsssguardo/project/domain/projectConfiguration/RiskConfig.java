package wsssguardo.project.domain.projectConfiguration;

import java.util.List;

import lombok.Data;

@Data
public class RiskConfig {

  private Integer minRange;

  private Integer maxRange;

  private List<RiskCategory> categories;

}
