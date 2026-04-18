package wsssguardo.project.domain.projectConfiguration;

import java.util.List;

import lombok.Data;

@Data
public class RiskConfig {

  private RiskDisplayType type;

  private Integer minRange;

  private Integer maxRange;

  private List<String> categories;

}
