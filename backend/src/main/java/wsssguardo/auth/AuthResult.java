package wsssguardo.auth;

public record AuthResult(
        String status,
        String session,
        TokenPair tokens
) {
    public static AuthResult success(TokenPair tokens) {
        return new AuthResult("SUCCESS", null, tokens);
    }

    public static AuthResult mfaRequired(String session) {
        return new AuthResult("MFA_REQUIRED", session, null);
    }

    public static AuthResult mfaSetupRequired(String session) {
        return new AuthResult("MFA_SETUP_REQUIRED", session, null);
    }

    public static AuthResult newPasswordRequired(String session) {
        return new AuthResult("NEW_PASSWORD_REQUIRED", session, null);
    }

    public boolean requiresTokens() {
        return "SUCCESS".equals(status);
    }
}
