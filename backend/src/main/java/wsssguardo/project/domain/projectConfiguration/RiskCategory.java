package wsssguardo.project.domain.projectConfiguration;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskCategory implements Serializable {
  
  private String label;

  private Integer minRange;

  private Integer maxRange;

}
