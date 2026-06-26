package wsssguardo.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CognitoAuthService {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${cognito.client-id}")
    private String clientId;

    @Value("${cognito.client-secret}")
    private String clientSecret;

    @Value("${cognito.user-pool-id:placeholder}")
    private String userPoolId;

    public AuthResult login(String email, String password) {
        InitiateAuthResponse response = cognitoClient.initiateAuth(
                InitiateAuthRequest.builder()
                        .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                        .clientId(clientId)
                        .authParameters(Map.of(
                                "USERNAME", email,
                                "PASSWORD", password,
                                "SECRET_HASH", computeSecretHash(email)
                        ))
                        .build()
        );

        return switch (response.challengeNameAsString()) {
            case "SOFTWARE_TOKEN_MFA" -> AuthResult.mfaRequired(response.session());
            case "MFA_SETUP"          -> AuthResult.mfaSetupRequired(response.session());
            case "NEW_PASSWORD_REQUIRED" -> AuthResult.newPasswordRequired(response.session());
            case null -> AuthResult.success(toTokenPair(response.authenticationResult()));
            default -> AuthResult.mfaRequired(response.session());
        };
    }

    public AuthResult setNewPassword(String session, String email, String newPassword) {
        RespondToAuthChallengeResponse response = cognitoClient.respondToAuthChallenge(
                RespondToAuthChallengeRequest.builder()
                        .challengeName(ChallengeNameType.NEW_PASSWORD_REQUIRED)
                        .clientId(clientId)
                        .session(session)
                        .challengeResponses(Map.of(
                                "USERNAME", email,
                                "NEW_PASSWORD", newPassword,
                                "SECRET_HASH", computeSecretHash(email)
                        ))
                        .build()
        );

        return switch (response.challengeNameAsString()) {
            case "MFA_SETUP" -> AuthResult.mfaSetupRequired(response.session());
            case null -> AuthResult.success(toTokenPair(response.authenticationResult()));
            default -> AuthResult.mfaSetupRequired(response.session());
        };
    }

    public MfaSetupStartResult startMfaSetup(String session) {
        AssociateSoftwareTokenResponse response = cognitoClient.associateSoftwareToken(
                AssociateSoftwareTokenRequest.builder()
                        .session(session)
                        .build()
        );
        return new MfaSetupStartResult(response.session(), response.secretCode());
    }

    public TokenPair completeMfaSetup(String session, String email, String code) {
        VerifySoftwareTokenResponse verifyResponse = cognitoClient.verifySoftwareToken(
                VerifySoftwareTokenRequest.builder()
                        .session(session)
                        .userCode(code)
                        .build()
        );

        RespondToAuthChallengeResponse response = cognitoClient.respondToAuthChallenge(
                RespondToAuthChallengeRequest.builder()
                        .challengeName(ChallengeNameType.MFA_SETUP)
                        .clientId(clientId)
                        .session(verifyResponse.session())
                        .challengeResponses(Map.of(
                                "USERNAME", email,
                                "SECRET_HASH", computeSecretHash(email)
                        ))
                        .build()
        );

        TokenPair tokens = toTokenPair(response.authenticationResult());
        // O desafio MFA_SETUP sozinho não popula o UserMFASettingList; gravamos a preferência
        // para manter o estado consistente. Best-effort: não quebra o login se falhar.
        try {
            setSoftwareTokenMfaPreferred(tokens.accessToken());
        } catch (CognitoIdentityProviderException e) {
            log.warn("Falha ao gravar preferência de MFA no setup do login: {}",
                    e.awsErrorDetails().errorCode());
        }
        return tokens;
    }

    public TokenPair respondToMfaChallenge(String session, String email, String code) {
        RespondToAuthChallengeResponse response = cognitoClient.respondToAuthChallenge(
                RespondToAuthChallengeRequest.builder()
                        .challengeName(ChallengeNameType.SOFTWARE_TOKEN_MFA)
                        .clientId(clientId)
                        .session(session)
                        .challengeResponses(Map.of(
                                "USERNAME", email,
                                "SOFTWARE_TOKEN_MFA_CODE", code,
                                "SECRET_HASH", computeSecretHash(email)
                        ))
                        .build()
        );

        return toTokenPair(response.authenticationResult());
    }

    public TokenPair refresh(String refreshToken, String email) {
        InitiateAuthResponse response = cognitoClient.initiateAuth(
                InitiateAuthRequest.builder()
                        .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                        .clientId(clientId)
                        .authParameters(Map.of(
                                "REFRESH_TOKEN", refreshToken,
                                "SECRET_HASH", computeSecretHash(email)
                        ))
                        .build()
        );

        return toTokenPair(response.authenticationResult());
    }

    public void globalSignOut(String accessToken) {
        cognitoClient.globalSignOut(
                GlobalSignOutRequest.builder()
                        .accessToken(accessToken)
                        .build()
        );
    }

    // --- self-service (usuário autenticado, via access token) ---

    public void changePassword(String accessToken, String currentPassword, String newPassword) {
        cognitoClient.changePassword(
                ChangePasswordRequest.builder()
                        .accessToken(accessToken)
                        .previousPassword(currentPassword)
                        .proposedPassword(newPassword)
                        .build()
        );
    }

    // Troca o email direto (sem fluxo de verificação por código) e marca como verificado.
    // Usa a API admin pois email_verified só pode ser definido por um administrador.
    public void updateEmail(String cognitoUsername, String newEmail) {
        cognitoClient.adminUpdateUserAttributes(
                AdminUpdateUserAttributesRequest.builder()
                        .userPoolId(userPoolId)
                        .username(cognitoUsername)
                        .userAttributes(
                                AttributeType.builder().name("email").value(newEmail).build(),
                                AttributeType.builder().name("email_verified").value("true").build()
                        )
                        .build()
        );
    }

    // Atualiza nome/sobrenome no Cognito (given_name/family_name).
    // Usa a API admin para manter o mesmo padrão de updateEmail (sem depender do access token aqui).
    public void updateName(String cognitoUsername, String firstName, String lastName) {
        cognitoClient.adminUpdateUserAttributes(
                AdminUpdateUserAttributesRequest.builder()
                        .userPoolId(userPoolId)
                        .username(cognitoUsername)
                        .userAttributes(
                                AttributeType.builder().name("given_name").value(firstName).build(),
                                AttributeType.builder().name("family_name")
                                        .value(lastName == null ? "" : lastName).build()
                        )
                        .build()
        );
    }

    public boolean isMfaEnabled(String accessToken) {
        GetUserResponse response = cognitoClient.getUser(
                GetUserRequest.builder().accessToken(accessToken).build()
        );
        if (response.userMFASettingList().contains("SOFTWARE_TOKEN_MFA")) {
            return true;
        }
        // O UserMFASettingList só é populado por SetUserMFAPreference — e o fluxo de setup
        // no login (completeMfaSetup) não o chama, então fica vazio mesmo com TOTP ativo.
        // Se o pool exige MFA (ON), qualquer usuário autenticado já passou pelo desafio TOTP.
        return isPoolMfaMandatory();
    }

    private boolean isPoolMfaMandatory() {
        GetUserPoolMfaConfigResponse cfg = cognitoClient.getUserPoolMfaConfig(
                GetUserPoolMfaConfigRequest.builder().userPoolId(userPoolId).build()
        );
        return cfg.mfaConfiguration() == UserPoolMfaType.ON;
    }

    // Inicia o registro de um novo dispositivo TOTP para o usuário logado.
    public String startMfaDeviceSetup(String accessToken) {
        AssociateSoftwareTokenResponse response = cognitoClient.associateSoftwareToken(
                AssociateSoftwareTokenRequest.builder()
                        .accessToken(accessToken)
                        .build()
        );
        return response.secretCode();
    }

    // Valida o código do app autenticador e passa a exigir MFA por TOTP.
    public void verifyAndEnableMfaDevice(String accessToken, String code) {
        cognitoClient.verifySoftwareToken(
                VerifySoftwareTokenRequest.builder()
                        .accessToken(accessToken)
                        .userCode(code)
                        .build()
        );
        setSoftwareTokenMfaPreferred(accessToken);
    }

    // Marca o TOTP como MFA habilitado e preferido — popula o UserMFASettingList do usuário.
    private void setSoftwareTokenMfaPreferred(String accessToken) {
        cognitoClient.setUserMFAPreference(
                SetUserMfaPreferenceRequest.builder()
                        .accessToken(accessToken)
                        .softwareTokenMfaSettings(
                                SoftwareTokenMfaSettingsType.builder()
                                        .enabled(true)
                                        .preferredMfa(true)
                                        .build()
                        )
                        .build()
        );
    }

    // SECRET_HASH = Base64(HMAC-SHA256(key=clientSecret, msg=email+clientId))
    String computeSecretHash(String username) {
        try {
            String message = username + clientId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(clientSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao computar SECRET_HASH", e);
        }
    }

    private TokenPair toTokenPair(AuthenticationResultType result) {
        return new TokenPair(result.accessToken(), result.idToken(), result.refreshToken());
    }

    public record MfaSetupStartResult(String session, String secretCode) {}
}
