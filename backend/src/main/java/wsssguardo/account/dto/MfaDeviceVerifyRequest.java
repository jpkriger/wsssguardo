package wsssguardo.account.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaDeviceVerifyRequest(
        @NotBlank String code
) {}
