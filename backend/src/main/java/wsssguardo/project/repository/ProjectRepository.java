package wsssguardo.project.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import wsssguardo.project.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByCompanyId(UUID companyId);

    @Query("""
            select p.id
            from Project p
            join p.projectUsers pu
            where pu.user.id = :userId
                and p.deletedAt is null
                and pu.deletedAt is null
            order by p.createdAt desc
            """)
    List<UUID> findProjectIdsByUserId(@Param("userId") UUID userId);

    @Query("""
            select count(pu) > 0
            from ProjectUser pu
            where pu.user.id = :userId
                and pu.project.id = :projectId
                and pu.deletedAt is null
            """)
    boolean existsMember(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    @Query("""
            select p
            from Project p
            where p.id in :ids
                and p.deletedAt is null
            """)
    List<Project> findAllByIdIn(@Param("ids") List<UUID> ids);
}
