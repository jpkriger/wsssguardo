package wsssguardo.project.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_deletion_audits")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDeletionAudit {

    @Id
    @Column(nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(name = "project_name", nullable = false, updatable = false)
    private String projectName;

    @Column(name = "company_name", nullable = false, updatable = false)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_status", nullable = false, updatable = false)
    private ProjectStatus projectStatus;

    @Column(name = "project_start_date", updatable = false)
    private LocalDate projectStartDate;

    @Column(name = "project_end_date", updatable = false)
    private LocalDate projectEndDate;

    @Column(name = "deleted_by", nullable = false, updatable = false)
    private String deletedBy;

    @Column(name = "deleted_at", nullable = false, updatable = false)
    private LocalDateTime deletedAt;
}
