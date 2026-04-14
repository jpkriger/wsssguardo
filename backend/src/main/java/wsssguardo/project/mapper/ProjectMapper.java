package wsssguardo.project.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.project.Project;
import wsssguardo.project.dto.ProjectResponse;

@Component
public class ProjectMapper {

    public ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getCustomer() != null ? project.getCustomer().getId() : null,
            project.getStartDate(),
            project.getEndDate(),
            project.getStatus()
        );
    }
}