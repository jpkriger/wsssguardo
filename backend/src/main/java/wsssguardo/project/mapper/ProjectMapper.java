package wsssguardo.project.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.dto.ProjectResponse;

import java.util.List;

@Component
public class ProjectMapper {

    public ProjectResponse toResponse(Project project) {
        List<java.util.UUID> consultantIds = project.getProjectUsers() == null
            ? List.of()
            : project.getProjectUsers().stream()
                .filter(pu -> pu.getDeletedAt() == null)
                .map(pu -> pu.getUser().getId())
                .toList();

        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getCompany() != null ? project.getCompany().getId() : null,
            project.getStartDate(),
            project.getEndDate(),
            project.getStatus(),
            consultantIds
        );
    }
}