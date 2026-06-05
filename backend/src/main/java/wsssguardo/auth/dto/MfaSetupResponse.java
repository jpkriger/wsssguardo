package wsssguardo.auth.dto;

public record MfaSetupResponse(
        String session,
        String otpauthUri
) {}
