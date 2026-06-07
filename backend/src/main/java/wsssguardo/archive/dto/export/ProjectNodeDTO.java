package wsssguardo.archive.dto.export;

import java.time.LocalDate;
import java.util.UUID;

import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;

public record ProjectNodeDTO(
        UUID id,
        String name,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        UUID companyId,
        ProjectConfiguration configuration,
        AuditDTO audit
) {
}
