package wsssguardo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminUpdateUserAttributesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AuthenticationResultType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ChangePasswordRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserPoolMfaConfigRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserPoolMfaConfigResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GlobalSignOutRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InitiateAuthRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InitiateAuthResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.RespondToAuthChallengeRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.RespondToAuthChallengeResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.SetUserMfaPreferenceRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserPoolMfaType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenResponse;

@ExtendWith(MockitoExtension.class)
class CognitoAuthServiceTest {

    @Mock
    private CognitoIdentityProviderClient cognitoClient;

    private CognitoAuthService service;

    @BeforeEach
    void setUp() {
        service = new CognitoAuthService(cognitoClient);
        ReflectionTestUtils.setField(service, "clientId", "client-123");
        ReflectionTestUtils.setField(service, "clientSecret", "super-secret");
        ReflectionTestUtils.setField(service, "userPoolId", "pool-123");
    }

    private AuthenticationResultType authResult() {
        return AuthenticationResultType.builder()
                .accessToken("access-token")
                .idToken("id-token")
                .refreshToken("refresh-token")
                .build();
    }

    @Test
    void loginShouldReturnSuccessWhenNoChallenge() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .authenticationResult(authResult())
                        .build());

        AuthResult result = service.login("user@x.com", "pass");

        assertEquals("SUCCESS", result.status());
        assertEquals("access-token", result.tokens().accessToken());
    }

    @Test
    void loginShouldReturnMfaRequiredWhenChallengeIsSoftwareTokenMfa() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .challengeName("SOFTWARE_TOKEN_MFA")
                        .session("session-abc")
                        .build());

        AuthResult result = service.login("user@x.com", "pass");

        assertEquals("MFA_REQUIRED", result.status());
        assertEquals("session-abc", result.session());
    }

    @Test
    void loginShouldReturnMfaSetupRequiredWhenChallengeIsMfaSetup() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .challengeName("MFA_SETUP")
                        .session("session-abc")
                        .build());

        AuthResult result = service.login("user@x.com", "pass");

        assertEquals("MFA_SETUP_REQUIRED", result.status());
    }

    @Test
    void loginShouldReturnNewPasswordRequiredWhenChallengeRequiresNewPassword() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .challengeName("NEW_PASSWORD_REQUIRED")
                        .session("session-abc")
                        .build());

        AuthResult result = service.login("user@x.com", "pass");

        assertEquals("NEW_PASSWORD_REQUIRED", result.status());
    }

    @Test
    void loginShouldFallBackToMfaRequiredForUnknownChallenge() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .challengeName("SOME_OTHER_CHALLENGE")
                        .session("session-abc")
                        .build());

        AuthResult result = service.login("user@x.com", "pass");

        assertEquals("MFA_REQUIRED", result.status());
    }

    @Test
    void setNewPasswordShouldReturnSuccessWhenNoChallenge() {
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .authenticationResult(authResult())
                        .build());

        AuthResult result = service.setNewPassword("session", "user@x.com", "newpassword123");

        assertEquals("SUCCESS", result.status());
    }

    @Test
    void setNewPasswordShouldReturnMfaSetupRequiredWhenChallengePresent() {
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .challengeName("MFA_SETUP")
                        .session("session-2")
                        .build());

        AuthResult result = service.setNewPassword("session", "user@x.com", "newpassword123");

        assertEquals("MFA_SETUP_REQUIRED", result.status());
    }

    @Test
    void setNewPasswordShouldFallBackToMfaSetupRequiredForUnknownChallenge() {
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .challengeName("WEIRD")
                        .session("session-2")
                        .build());

        AuthResult result = service.setNewPassword("session", "user@x.com", "newpassword123");

        assertEquals("MFA_SETUP_REQUIRED", result.status());
    }

    @Test
    void startMfaSetupShouldReturnSessionAndSecret() {
        when(cognitoClient.associateSoftwareToken(any(AssociateSoftwareTokenRequest.class)))
                .thenReturn(AssociateSoftwareTokenResponse.builder()
                        .session("session-3")
                        .secretCode("SECRET123")
                        .build());

        CognitoAuthService.MfaSetupStartResult result = service.startMfaSetup("session");

        assertEquals("session-3", result.session());
        assertEquals("SECRET123", result.secretCode());
    }

    @Test
    void completeMfaSetupShouldReturnTokensAndSetMfaPreference() {
        when(cognitoClient.verifySoftwareToken(any(VerifySoftwareTokenRequest.class)))
                .thenReturn(VerifySoftwareTokenResponse.builder().session("session-4").build());
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .authenticationResult(authResult())
                        .build());

        TokenPair tokens = service.completeMfaSetup("session", "user@x.com", "123456");

        assertEquals("access-token", tokens.accessToken());
        verify(cognitoClient).setUserMFAPreference(any(SetUserMfaPreferenceRequest.class));
    }

    @Test
    void completeMfaSetupShouldNotThrowWhenSetMfaPreferenceFails() {
        when(cognitoClient.verifySoftwareToken(any(VerifySoftwareTokenRequest.class)))
                .thenReturn(VerifySoftwareTokenResponse.builder().session("session-4").build());
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .authenticationResult(authResult())
                        .build());
        when(cognitoClient.setUserMFAPreference(any(SetUserMfaPreferenceRequest.class)))
                .thenThrow(cognitoException("InternalErrorException"));

        TokenPair tokens = service.completeMfaSetup("session", "user@x.com", "123456");

        assertEquals("access-token", tokens.accessToken());
    }

    @Test
    void respondToMfaChallengeShouldReturnTokens() {
        when(cognitoClient.respondToAuthChallenge(any(RespondToAuthChallengeRequest.class)))
                .thenReturn(RespondToAuthChallengeResponse.builder()
                        .authenticationResult(authResult())
                        .build());

        TokenPair tokens = service.respondToMfaChallenge("session", "user@x.com", "123456");

        assertEquals("id-token", tokens.idToken());
    }

    @Test
    void refreshShouldReturnTokens() {
        when(cognitoClient.initiateAuth(any(InitiateAuthRequest.class)))
                .thenReturn(InitiateAuthResponse.builder()
                        .authenticationResult(authResult())
                        .build());

        TokenPair tokens = service.refresh("refresh-tok", "user@x.com");

        assertEquals("refresh-token", tokens.refreshToken());
    }

    @Test
    void globalSignOutShouldCallCognito() {
        service.globalSignOut("access-token");

        verify(cognitoClient).globalSignOut(any(GlobalSignOutRequest.class));
    }

    @Test
    void changePasswordShouldCallCognito() {
        service.changePassword("access-token", "old", "new");

        verify(cognitoClient).changePassword(any(ChangePasswordRequest.class));
    }

    @Test
    void updateEmailShouldCallAdminUpdateUserAttributes() {
        service.updateEmail("cognito-sub", "new@x.com");

        verify(cognitoClient).adminUpdateUserAttributes(any(AdminUpdateUserAttributesRequest.class));
    }

    @Test
    void updateNameShouldHandleNullLastName() {
        service.updateName("cognito-sub", "First", null);

        verify(cognitoClient).adminUpdateUserAttributes(any(AdminUpdateUserAttributesRequest.class));
    }

    @Test
    void isMfaEnabledShouldReturnTrueWhenUserHasSoftwareTokenMfaSetting() {
        when(cognitoClient.getUser(any(GetUserRequest.class)))
                .thenReturn(GetUserResponse.builder()
                        .userMFASettingList("SOFTWARE_TOKEN_MFA")
                        .build());

        assertTrue(service.isMfaEnabled("access-token"));
    }

    @Test
    void isMfaEnabledShouldFallBackToPoolMandatoryCheckWhenSettingListEmpty() {
        when(cognitoClient.getUser(any(GetUserRequest.class)))
                .thenReturn(GetUserResponse.builder().build());
        when(cognitoClient.getUserPoolMfaConfig(any(GetUserPoolMfaConfigRequest.class)))
                .thenReturn(GetUserPoolMfaConfigResponse.builder()
                        .mfaConfiguration(UserPoolMfaType.ON)
                        .build());

        assertTrue(service.isMfaEnabled("access-token"));
    }

    @Test
    void isMfaEnabledShouldReturnFalseWhenPoolMfaIsOff() {
        when(cognitoClient.getUser(any(GetUserRequest.class)))
                .thenReturn(GetUserResponse.builder().build());
        when(cognitoClient.getUserPoolMfaConfig(any(GetUserPoolMfaConfigRequest.class)))
                .thenReturn(GetUserPoolMfaConfigResponse.builder()
                        .mfaConfiguration(UserPoolMfaType.OFF)
                        .build());

        assertFalse(service.isMfaEnabled("access-token"));
    }

    @Test
    void startMfaDeviceSetupShouldReturnSecretCode() {
        when(cognitoClient.associateSoftwareToken(any(AssociateSoftwareTokenRequest.class)))
                .thenReturn(AssociateSoftwareTokenResponse.builder()
                        .secretCode("SECRET456")
                        .build());

        String secret = service.startMfaDeviceSetup("access-token");

        assertEquals("SECRET456", secret);
    }

    @Test
    void verifyAndEnableMfaDeviceShouldVerifyAndSetPreference() {
        service.verifyAndEnableMfaDevice("access-token", "123456");

        verify(cognitoClient).verifySoftwareToken(any(VerifySoftwareTokenRequest.class));
        verify(cognitoClient).setUserMFAPreference(any(SetUserMfaPreferenceRequest.class));
    }

    @Test
    void computeSecretHashShouldBeDeterministic() {
        String hash1 = service.computeSecretHash("user@x.com");
        String hash2 = service.computeSecretHash("user@x.com");
        String hashOther = service.computeSecretHash("other@x.com");

        assertEquals(hash1, hash2);
        assertNotNull(hash1);
        assertFalse(hash1.equals(hashOther));
    }

    private CognitoIdentityProviderException cognitoException(String errorCode) {
        return (CognitoIdentityProviderException) CognitoIdentityProviderException.builder()
                .message(errorCode)
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode(errorCode)
                        .errorMessage(errorCode)
                        .build())
                .build();
    }
}
