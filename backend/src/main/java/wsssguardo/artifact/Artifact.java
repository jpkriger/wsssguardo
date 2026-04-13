package wsssguardo.artifact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.*;
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
public class Artifact extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String category;

    @Column(name = "drive_link")
    private String driveLink;

    @Column(name = "llm_summary", columnDefinition = "TEXT")
    private String llmSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArtifactType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

}
