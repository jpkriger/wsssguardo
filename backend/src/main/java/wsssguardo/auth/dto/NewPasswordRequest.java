package wsssguardo.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewPasswordRequest(
        @NotBlank String session,
        @NotBlank String email,
        @NotBlank @Size(min = 12) String newPassword
) {}
