package wsssguardo.project.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.project.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
}
