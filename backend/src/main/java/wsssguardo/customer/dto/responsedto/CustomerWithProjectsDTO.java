package wsssguardo.customer.dto.responsedto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import wsssguardo.project.dto.ProjectResponse;

public record CustomerWithProjectsDTO(
    UUID id,
    String name,
    LocalDateTime createdAt,
    List<ProjectResponse> projects
) {

}
