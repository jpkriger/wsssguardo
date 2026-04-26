package wsssguardo.finding;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.finding.domain.FindingSeverity;
import wsssguardo.project.Project;
import wsssguardo.shared.domain.BaseEntity;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "findings")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE findings SET deleted_at = NOW() WHERE id = ?")
public class Finding extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "numeric_severity")
    private Integer numericSeverity;

    @Enumerated(EnumType.STRING)
    @Column(name = "categorical_severity")
    private FindingSeverity categoricalSeverity;

    @Column(name = "category")
    private String category;

    @Column(name = "reference")
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "finding_assets",
            joinColumns = @JoinColumn(name = "finding_id"),
            inverseJoinColumns = @JoinColumn(name = "asset_id")
    )
    @Builder.Default
    private Set<Asset> linkedAssets = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "finding_artifacts",
            joinColumns = @JoinColumn(name = "finding_id"),
            inverseJoinColumns = @JoinColumn(name = "artifact_id")
    )
    @Builder.Default
    private Set<Artifact> linkedArtifacts = new HashSet<>();

}
