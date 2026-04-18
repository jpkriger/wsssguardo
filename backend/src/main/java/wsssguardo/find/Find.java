package wsssguardo.find;

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
import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.find.domain.FindCategory;
import wsssguardo.project.Project;
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "finds")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE finds SET deleted_at = NOW() WHERE id = ?")
public class Find extends BaseEntity {

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<FindCategory> categories;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<Asset> assets;

  @ManyToMany(fetch = FetchType.LAZY)
  private List<Artifact> artifacts;

  private String sector;

  @Column(name = "quantitative_criticality")
  private Integer quantitativeCriticality;

  private String criticality;

  private String description;

  @Column(name = "threat_event")
  private String threatEvent;

  private String reference;

  private String recommendation;

}
