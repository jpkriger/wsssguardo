package wsssguardo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaSetupRequest(
        @NotBlank String session,
        @NotBlank String email,
        @NotBlank String code
) {}
