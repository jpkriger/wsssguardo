package wsssguardo.archive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Confirmação de backup: o operador reapresenta o SHA-256 (hex) do .p7m efetivamente
 * baixado. Só então a purga é executada.
 */
public record ArchiveConfirmRequest(
        @NotBlank
        @Pattern(regexp = "^[0-9a-fA-F]{64}$", message = "sha256 deve ser 64 caracteres hexadecimais")
        String sha256
) {
}
