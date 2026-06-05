package wsssguardo.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CognitoAuthService {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${cognito.client-id}")
    private String clientId;

    @Value("${cognito.client-secret}")
    private String clientSecret;

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

        return toTokenPair(response.authenticationResult());
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
