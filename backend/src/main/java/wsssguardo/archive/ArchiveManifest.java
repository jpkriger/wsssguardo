package wsssguardo.archive;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
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
import lombok.Setter;
import wsssguardo.archive.domain.ArchiveStatus;

/**
 * Trilha de auditoria permanente de um arquivamento de projeto.
 *
 * <p>Não estende {@code BaseEntity} de propósito: o manifesto deve sobreviver à
 * purga das linhas do projeto e nunca é soft-deletado.
 */
@Entity
@Table(name = "archive_manifests")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ArchiveManifest {

    @Id
    @Column(nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(name = "project_id", nullable = false, updatable = false)
    private UUID projectId;

    @Column(name = "project_name", nullable = false, updatable = false)
    private String projectName;

    @Column(name = "file_name", nullable = false, updatable = false)
    private String fileName;

    /** SHA-256 (hex) do arquivo .p7m gerado. */
    @Column(nullable = false, updatable = false, length = 64)
    private String sha256;

    @Column(name = "size_bytes", nullable = false, updatable = false)
    private long sizeBytes;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ArchiveStatus status;

    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "confirmed_by")
    private String confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
