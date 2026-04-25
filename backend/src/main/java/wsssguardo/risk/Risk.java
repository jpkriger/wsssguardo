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
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "risks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE risks SET deleted_at = NOW() WHERE id = ?")
public class Risk extends BaseEntity {
  
  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<Find> finds;

  private String description;

  private String consequences;

  private Float occurrenceProbability;

  private Float impactProbability;

  private String damageOperations;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<Asset> damageAssets;

  private String damageIndividuals;

  private String damageOtherOrgs;

  private String recommendation;

  // Valor normalizado 0 - 10000 mapeia em runtime conforme configuração
  @Column(name = "risk_level")
  private Integer riskLevel;

}