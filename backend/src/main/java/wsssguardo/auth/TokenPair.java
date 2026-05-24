package wsssguardo.auth;

public record TokenPair(
        String accessToken,
        String idToken,
        String refreshToken
) {}
