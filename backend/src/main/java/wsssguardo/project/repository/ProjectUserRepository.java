package wsssguardo.project.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import wsssguardo.project.domain.ProjectUser;

public interface ProjectUserRepository extends JpaRepository<ProjectUser, UUID> {

    // Busca todos os registros do projeto incluindo soft-deletados.
    // Usa SQL nativo para ignorar o @SQLRestriction("deleted_at IS NULL") do BaseEntity.
    @Query(value = "SELECT * FROM project_users WHERE project_id = :projectId", nativeQuery = true)
    List<ProjectUser> findAllByProjectIdIncludingDeleted(@Param("projectId") UUID projectId);
}
