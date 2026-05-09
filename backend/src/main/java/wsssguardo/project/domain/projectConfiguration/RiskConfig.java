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
public class RiskConfig implements Serializable {

  private Integer minRange;

  private Integer maxRange;

  private List<RiskCategory> categories;
  
}
