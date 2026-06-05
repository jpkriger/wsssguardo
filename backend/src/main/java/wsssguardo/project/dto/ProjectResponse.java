package wsssguardo.project.dto;

import java.time.LocalDate;
import java.util.UUID;

import wsssguardo.project.domain.ProjectStatus;

public record ProjectResponse(
    UUID id,
    String name,
    UUID companyId,
    LocalDate startDate,
    LocalDate endDate,
    ProjectStatus status
) {
}