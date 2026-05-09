package wsssguardo.project.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectCreateRequest(
    @NotBlank(message = "name must not be blank")
    @Size(max = 255, message = "name must not exceed 255 characters")
    String name,

    @NotNull(message = "customerId must not be null")
    UUID customerId,

    LocalDate startDate,
    LocalDate endDate,

    List<UUID> consultantIds
) {
}
