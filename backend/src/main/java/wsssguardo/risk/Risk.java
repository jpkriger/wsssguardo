package wsssguardo.risk;

import java.util.List;

import org.hibernate.annotations.SQLDelete;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import wsssguardo.find.Find;
import wsssguardo.project.Project;

@Entity
@Table(name = "risks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE risks SET deleted_at = NOW() WHERE id = ?")
public class Risk {
  
  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<Find> finds;

  private String description;

  private String consequences;

  private String recommendation;

  @Column(name = "quantitative_criticality")
  private Integer quantitativeCriticality;

}
