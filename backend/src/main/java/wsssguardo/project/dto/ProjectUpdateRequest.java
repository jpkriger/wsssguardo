package wsssguardo.project.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Size;
import wsssguardo.project.domain.ProjectStatus;

public record ProjectUpdateRequest(
    @Size(max = 255, message = "name must not exceed 255 characters")
    String name,

    UUID customerId,

    LocalDate startDate,
    LocalDate endDate,

    List<UUID> consultantIds,

    ProjectStatus status
) {
}
