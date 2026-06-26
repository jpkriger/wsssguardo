package wsssguardo.account;

import jakarta.validation.Valid;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AliasExistsException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CodeMismatchException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.EnableSoftwareTokenMfaException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InvalidPasswordException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.LimitExceededException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.NotAuthorizedException;
import wsssguardo.account.dto.ChangePasswordRequest;
import wsssguardo.account.dto.MfaDeviceSetupResponse;
import wsssguardo.account.dto.MfaDeviceVerifyRequest;
import wsssguardo.account.dto.MfaStatusResponse;
import wsssguardo.account.dto.UpdateProfileRequest;
import wsssguardo.auth.CognitoAuthService;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.user.User;
import wsssguardo.user.service.UserService;

/**
 * Operações self-service da conta do usuário autenticado (tela de perfil).
 * Todas usam o access token do cookie de sessão — diferente do {@code AuthController},
 * que opera sobre challenges de login com session + SECRET_HASH.
 */
@Slf4j
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final CognitoAuthService cognitoAuthService;
    private final UserService userService;
    private final AuthenticatedUser authenticatedUser;

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @Valid @RequestBody ChangePasswordRequest req) {
        requireToken(accessToken);
        try {
            cognitoAuthService.changePassword(accessToken, req.currentPassword(), req.newPassword());
            return ResponseEntity.noContent().build();
        } catch (NotAuthorizedException e) {
            throw new ApiException("Senha atual incorreta", HttpStatus.BAD_REQUEST);
        } catch (InvalidPasswordException e) {
            throw new ApiException("A nova senha não atende à política de segurança", HttpStatus.BAD_REQUEST);
        } catch (LimitExceededException e) {
            throw new ApiException("Muitas tentativas. Tente novamente mais tarde", HttpStatus.TOO_MANY_REQUESTS);
        } catch (CognitoIdentityProviderException e) {
            throw cognitoError("Falha ao alterar a senha", e);
        }
    }

    /**
     * Atualiza nome e/ou e-mail num único request (casa com o "Salvar alterações" da tela).
     * Só toca o que mudou. A unicidade do e-mail é checada no banco ANTES de mexer no Cognito,
     * evitando o drift (Cognito atualizado mas banco rejeitando por e-mail duplicado).
     */
    @PatchMapping("/profile")
    public ResponseEntity<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        User user = requireUser();
        String firstName = req.firstName().trim();
        String lastName = req.lastName() == null ? null : req.lastName().trim();
        String newEmail = req.email().trim();

        String currentFirst = user.getFirstName() == null ? "" : user.getFirstName();
        String currentLast = user.getLastName() == null ? "" : user.getLastName();
        boolean nameChanged = !firstName.equals(currentFirst)
                || !(lastName == null ? "" : lastName).equals(currentLast);
        boolean emailChanged = !newEmail.equalsIgnoreCase(
                user.getEmail() == null ? "" : user.getEmail());

        // Valida unicidade no banco antes de qualquer escrita no Cognito.
        if (emailChanged) {
            userService.ensureEmailAvailable(user, newEmail);
        }

        try {
            if (nameChanged) {
                cognitoAuthService.updateName(user.getCognitoSub(), firstName, lastName);
            }
            if (emailChanged) {
                cognitoAuthService.updateEmail(user.getCognitoSub(), newEmail);
            }
        } catch (AliasExistsException e) {
            throw new ApiException("E-mail já está em uso", HttpStatus.CONFLICT);
        } catch (CognitoIdentityProviderException e) {
            throw cognitoError("Falha ao atualizar o perfil", e);
        }

        // Mantém o registro local em sincronia com o Cognito.
        if (nameChanged) {
            userService.updateName(user, firstName, lastName);
        }
        if (emailChanged) {
            userService.updateEmail(user, newEmail);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mfa")
    public ResponseEntity<MfaStatusResponse> mfaStatus(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        requireToken(accessToken);
        try {
            return ResponseEntity.ok(new MfaStatusResponse(cognitoAuthService.isMfaEnabled(accessToken)));
        } catch (CognitoIdentityProviderException e) {
            throw cognitoError("Falha ao consultar o status do MFA", e);
        }
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<MfaDeviceSetupResponse> mfaSetup(
            @CookieValue(value = "access_token", required = false) String accessToken) {
        requireToken(accessToken);
        User user = requireUser();
        try {
            String secret = cognitoAuthService.startMfaDeviceSetup(accessToken);
            // URL-encode: e-mails com '+' (ex.: user+test@x.com) quebram a URI/QR sem encode.
            String issuer = URLEncoder.encode("WSSSguardo", StandardCharsets.UTF_8);
            String account = URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);
            String otpauthUri = "otpauth://totp/" + issuer + ":" + account
                    + "?secret=" + secret
                    + "&issuer=" + issuer;
            return ResponseEntity.ok(new MfaDeviceSetupResponse(otpauthUri));
        } catch (CognitoIdentityProviderException e) {
            throw cognitoError("Falha ao iniciar o cadastro do dispositivo", e);
        }
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<Void> mfaVerify(
            @CookieValue(value = "access_token", required = false) String accessToken,
            @Valid @RequestBody MfaDeviceVerifyRequest req) {
        requireToken(accessToken);
        try {
            cognitoAuthService.verifyAndEnableMfaDevice(accessToken, req.code());
            return ResponseEntity.noContent().build();
        } catch (CodeMismatchException | EnableSoftwareTokenMfaException e) {
            throw new ApiException("Código inválido", HttpStatus.BAD_REQUEST);
        } catch (CognitoIdentityProviderException e) {
            throw cognitoError("Falha ao validar o dispositivo", e);
        }
    }

    // --- helpers ---

    private void requireToken(String accessToken) {
        if (accessToken == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
    }

    private User requireUser() {
        User user = authenticatedUser.get();
        if (user == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        return user;
    }

    private ApiException cognitoError(String message, CognitoIdentityProviderException e) {
        log.warn("{}: {} - {}", message,
                e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        return new ApiException(message, HttpStatus.BAD_REQUEST);
    }
}
