package wsssguardo.project.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.project.domain.ProjectDeletionAudit;

public interface ProjectDeletionAuditRepository extends JpaRepository<ProjectDeletionAudit, UUID> {
}
