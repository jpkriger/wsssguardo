package wsssguardo.company.dto.responsedto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import wsssguardo.project.dto.ProjectResponse;

public record CompanyWithProjectsDTO(
    UUID id,
    String name,
    LocalDateTime createdAt,
    List<ProjectResponse> projects
) {

}
