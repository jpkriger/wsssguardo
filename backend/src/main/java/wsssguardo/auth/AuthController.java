package wsssguardo.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
import wsssguardo.auth.CognitoAuthService.MfaSetupStartResult;
import wsssguardo.auth.dto.*;
import wsssguardo.user.service.UserService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CognitoAuthService cognitoAuthService;
    private final UserService userService;

    @Value("${auth.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${auth.cookie.domain:}")
    private String cookieDomain;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse res) {
        try {
            AuthResult result = cognitoAuthService.login(req.email(), req.password());
            return switch (result.status()) {
                case "SUCCESS" -> {
                    addTokenCookies(res, result.tokens());
                    yield ResponseEntity.ok(new LoginResponse("SUCCESS", null));
                }
                case "MFA_REQUIRED" ->
                    ResponseEntity.ok(new LoginResponse("MFA_REQUIRED", result.session()));
                case "MFA_SETUP_REQUIRED" ->
                    ResponseEntity.ok(new LoginResponse("MFA_SETUP_REQUIRED", result.session()));
                case "NEW_PASSWORD_REQUIRED" ->
                    ResponseEntity.ok(new LoginResponse("NEW_PASSWORD_REQUIRED", result.session()));
                default ->
                    ResponseEntity.ok(new LoginResponse(result.status(), result.session()));
            };
        } catch (CognitoIdentityProviderException e) {
            log.debug("Login failed for {}: {}", req.email(), e.awsErrorDetails().errorCode());
            return unauthorized();
        }
    }

    @PostMapping("/new-password")
    public ResponseEntity<?> newPassword(@Valid @RequestBody NewPasswordRequest req,
                                         HttpServletResponse res) {
        try {
            AuthResult result = cognitoAuthService.setNewPassword(req.session(), req.email(), req.newPassword());
            return switch (result.status()) {
                case "SUCCESS" -> {
                    addTokenCookies(res, result.tokens());
                    yield ResponseEntity.ok(new LoginResponse("SUCCESS", null));
                }
                case "MFA_SETUP_REQUIRED" ->
                    ResponseEntity.ok(new LoginResponse("MFA_SETUP_REQUIRED", result.session()));
                default ->
                    ResponseEntity.ok(new LoginResponse(result.status(), result.session()));
            };
        } catch (CognitoIdentityProviderException e) {
            log.debug("New password failed: {}", e.awsErrorDetails().errorCode());
            return unauthorized();
        }
    }

    @PostMapping("/mfa-setup")
    public ResponseEntity<?> mfaSetupStart(@RequestBody Map<String, String> body) {
        try {
            String session = body.get("session");
            String email = body.get("email");
            if (session == null || email == null) {
                return ResponseEntity.badRequest().build();
            }
            MfaSetupStartResult result = cognitoAuthService.startMfaSetup(session);
            String otpauthUri = "otpauth://totp/WSSSguardo:" + email
                + "?secret=" + result.secretCode()
                + "&issuer=WSSSguardo";
            return ResponseEntity.ok(new MfaSetupResponse(result.session(), otpauthUri));
        } catch (CognitoIdentityProviderException e) {
            log.debug("MFA setup start failed: {}", e.awsErrorDetails().errorCode());
            return unauthorized();
        }
    }

    @PostMapping("/mfa-setup/complete")
    public ResponseEntity<Void> mfaSetupComplete(@Valid @RequestBody MfaSetupRequest req,
                                                 HttpServletResponse res) {
        try {
            TokenPair tokens = cognitoAuthService.completeMfaSetup(req.session(), req.email(), req.code());
            addTokenCookies(res, tokens);
            return ResponseEntity.ok().build();
        } catch (CognitoIdentityProviderException e) {
            log.debug("MFA setup complete failed: {}", e.awsErrorDetails().errorCode());
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/mfa-verify")
    public ResponseEntity<Void> mfaVerify(@Valid @RequestBody MfaVerifyRequest req,
                                          HttpServletResponse res) {
        try {
            TokenPair tokens = cognitoAuthService.respondToMfaChallenge(req.session(), req.email(), req.code());
            addTokenCookies(res, tokens);
            return ResponseEntity.ok().build();
        } catch (CognitoIdentityProviderException e) {
            log.debug("MFA verify failed: {}", e.awsErrorDetails().errorCode());
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = "refresh_token", required = false) String refreshToken,
                                        @RequestParam(required = false) String email,
                                        HttpServletResponse res) {
        if (refreshToken == null || email == null) {
            return ResponseEntity.status(401).build();
        }
        // Cognito REFRESH_TOKEN_AUTH exige SECRET_HASH computado com o username interno (sub UUID),
        // não com o email. Buscamos o sub no banco para montar o hash correto.
        String cognitoUsername = userService.findCognitoSubByEmail(email)
                .orElse(email);
        try {
            TokenPair tokens = cognitoAuthService.refresh(refreshToken, cognitoUsername);
            addTokenCookies(res, tokens);
            return ResponseEntity.ok().build();
        } catch (CognitoIdentityProviderException e) {
            log.debug("Refresh failed: {}", e.awsErrorDetails().errorCode());
            clearTokenCookies(res);
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = "access_token", required = false) String accessToken,
                                       HttpServletResponse res) {
        if (accessToken != null) {
            try {
                cognitoAuthService.globalSignOut(accessToken);
            } catch (CognitoIdentityProviderException e) {
                log.debug("GlobalSignOut failed (token may already be expired): {}", e.awsErrorDetails().errorCode());
            }
        }
        clearTokenCookies(res);
        return ResponseEntity.ok().build();
    }

    // --- helpers ---

    private void addTokenCookies(HttpServletResponse res, TokenPair tokens) {
        addCookie(res, buildCookie("access_token", tokens.accessToken(), "/api", 3600));
        // Cognito não emite novo refresh token no fluxo de refresh — só atualiza quando presente
        if (tokens.refreshToken() != null) {
            addCookie(res, buildCookie("refresh_token", tokens.refreshToken(), "/api/auth/refresh", 30 * 24 * 3600));
        }
    }

    private void clearTokenCookies(HttpServletResponse res) {
        addCookie(res, buildCookie("access_token", "", "/api", 0));
        addCookie(res, buildCookie("refresh_token", "", "/api/auth/refresh", 0));
    }

    private ResponseCookie buildCookie(String name, String value, String path, long maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(path)
                .maxAge(maxAge)
                .sameSite("Strict");
        if (!cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }
        return builder.build();
    }

    private void addCookie(HttpServletResponse res, ResponseCookie cookie) {
        res.addHeader("Set-Cookie", cookie.toString());
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas"));
    }
}
