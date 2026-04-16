package wsssguardo.artifact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.project.Project;
import wsssguardo.shared.domain.BaseEntity;

@Entity
@Table(name = "artifacts")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@SQLDelete(sql = "UPDATE artifacts SET deleted_at = NOW() WHERE id = ?")
public class Artifact extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;
    private String content;

    @Column(name = "llm_summary")
    private String llmSummary;

    /* Category? */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArtifactType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

}
