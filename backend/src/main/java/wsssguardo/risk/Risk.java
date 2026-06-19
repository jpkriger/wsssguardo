package wsssguardo.risk;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
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
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "risks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Risk extends BaseEntity {

      @Column(nullable = false)
      private String name;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "project_id", nullable = false)
      private Project project;

      @ManyToMany(fetch = FetchType.LAZY)
      @JoinTable(name = "risks_finds", joinColumns = @JoinColumn(name = "risk_id"), inverseJoinColumns = @JoinColumn(name = "finds_id"))
      @Builder.Default
      private List<Find> finds = new ArrayList<>();

      private String description;

      private String consequences;

      private Float occurrenceProbability;

      private Float impactProbability;

      @Column(nullable = false)
      private Float damageOperations;

      @Column(nullable = false)
      private Float damageIndividuals;

      @Column(nullable = false)
      private Float damageOtherOrgs;

      @Column(nullable = false)
      private Float damageAssets;

      @Column(nullable = false)
      private Float generalRisk;

      @Enumerated(EnumType.STRING)
      @Column(nullable = false)
      private RiskPriority priority;

      @Column(length = 1000)
      private String aiSummary;

      private String recommendation;

}
