package wsssguardo.ai.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;

public record AiReportSummaryRequestDTO(
        @NotEmpty List<@NotBlank String> summaries,
        String reportType) {
}
