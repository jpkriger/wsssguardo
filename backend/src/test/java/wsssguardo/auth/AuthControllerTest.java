package wsssguardo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
import wsssguardo.auth.dto.LoginRequest;
import wsssguardo.auth.dto.LoginResponse;
import wsssguardo.auth.dto.MfaSetupRequest;
import wsssguardo.auth.dto.MfaSetupResponse;
import wsssguardo.auth.dto.MfaVerifyRequest;
import wsssguardo.auth.dto.NewPasswordRequest;
import wsssguardo.user.service.UserService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private CognitoAuthService cognitoAuthService;

    @Mock
    private UserService userService;

    private AuthController controller;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        controller = new AuthController(cognitoAuthService, userService);
        ReflectionTestUtils.setField(controller, "cookieSecure", true);
        ReflectionTestUtils.setField(controller, "cookieDomain", "");
        response = new MockHttpServletResponse();
    }

    private TokenPair tokensWithSub(String sub) {
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("{\"sub\":\"" + sub + "\"}").getBytes());
        String jwt = "header." + payload + ".sig";
        return new TokenPair(jwt, "id-token", "refresh-token");
    }

    private CognitoIdentityProviderException cognitoException() {
        return (CognitoIdentityProviderException) CognitoIdentityProviderException.builder()
                .message("boom")
                .awsErrorDetails(AwsErrorDetails.builder().errorCode("NotAuthorizedException").errorMessage("boom").build())
                .build();
    }

    @Test
    void loginShouldSetCookiesOnSuccess() {
        when(cognitoAuthService.login("user@x.com", "pass"))
                .thenReturn(AuthResult.success(tokensWithSub("sub-1")));

        ResponseEntity<?> result = controller.login(new LoginRequest("user@x.com", "pass"), response);

        assertEquals(200, result.getStatusCode().value());
        assertEquals("SUCCESS", ((LoginResponse) result.getBody()).status());
        assertTrue(response.getHeaders("Set-Cookie").stream().anyMatch(c -> c.startsWith("access_token=")));
        assertTrue(response.getHeaders("Set-Cookie").stream().anyMatch(c -> c.startsWith("cognito_sub=")));
    }

    @Test
    void loginShouldReturnMfaRequired() {
        when(cognitoAuthService.login("user@x.com", "pass"))
                .thenReturn(AuthResult.mfaRequired("session-1"));

        ResponseEntity<?> result = controller.login(new LoginRequest("user@x.com", "pass"), response);

        LoginResponse body = (LoginResponse) result.getBody();
        assertEquals("MFA_REQUIRED", body.status());
        assertEquals("session-1", body.session());
    }

    @Test
    void loginShouldReturnMfaSetupRequired() {
        when(cognitoAuthService.login("user@x.com", "pass"))
                .thenReturn(AuthResult.mfaSetupRequired("session-1"));

        ResponseEntity<?> result = controller.login(new LoginRequest("user@x.com", "pass"), response);

        assertEquals("MFA_SETUP_REQUIRED", ((LoginResponse) result.getBody()).status());
    }

    @Test
    void loginShouldReturnNewPasswordRequired() {
        when(cognitoAuthService.login("user@x.com", "pass"))
                .thenReturn(AuthResult.newPasswordRequired("session-1"));

        ResponseEntity<?> result = controller.login(new LoginRequest("user@x.com", "pass"), response);

        assertEquals("NEW_PASSWORD_REQUIRED", ((LoginResponse) result.getBody()).status());
    }

    @Test
    void loginShouldReturnUnauthorizedOnCognitoException() {
        when(cognitoAuthService.login(anyString(), anyString())).thenThrow(cognitoException());

        ResponseEntity<?> result = controller.login(new LoginRequest("user@x.com", "wrong"), response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void newPasswordShouldSetCookiesOnSuccess() {
        when(cognitoAuthService.setNewPassword("session", "user@x.com", "newpassword123"))
                .thenReturn(AuthResult.success(tokensWithSub("sub-2")));

        ResponseEntity<?> result = controller.newPassword(
                new NewPasswordRequest("session", "user@x.com", "newpassword123"), response);

        assertEquals("SUCCESS", ((LoginResponse) result.getBody()).status());
    }

    @Test
    void newPasswordShouldReturnMfaSetupRequired() {
        when(cognitoAuthService.setNewPassword("session", "user@x.com", "newpassword123"))
                .thenReturn(AuthResult.mfaSetupRequired("session-2"));

        ResponseEntity<?> result = controller.newPassword(
                new NewPasswordRequest("session", "user@x.com", "newpassword123"), response);

        assertEquals("MFA_SETUP_REQUIRED", ((LoginResponse) result.getBody()).status());
    }

    @Test
    void newPasswordShouldReturnUnauthorizedOnException() {
        when(cognitoAuthService.setNewPassword(anyString(), anyString(), anyString()))
                .thenThrow(cognitoException());

        ResponseEntity<?> result = controller.newPassword(
                new NewPasswordRequest("session", "user@x.com", "newpassword123"), response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void mfaSetupStartShouldReturnBadRequestWhenSessionMissing() {
        ResponseEntity<?> result = controller.mfaSetupStart(Map.of("email", "user@x.com"));

        assertEquals(400, result.getStatusCode().value());
    }

    @Test
    void mfaSetupStartShouldReturnBadRequestWhenEmailMissing() {
        ResponseEntity<?> result = controller.mfaSetupStart(Map.of("session", "s"));

        assertEquals(400, result.getStatusCode().value());
    }

    @Test
    void mfaSetupStartShouldReturnOtpauthUri() {
        when(cognitoAuthService.startMfaSetup("s1"))
                .thenReturn(new CognitoAuthService.MfaSetupStartResult("s2", "SECRET"));

        ResponseEntity<?> result = controller.mfaSetupStart(Map.of("session", "s1", "email", "user@x.com"));

        MfaSetupResponse body = (MfaSetupResponse) result.getBody();
        assertEquals("s2", body.session());
        assertTrue(body.otpauthUri().contains("SECRET"));
        assertTrue(body.otpauthUri().contains("user@x.com"));
    }

    @Test
    void mfaSetupStartShouldReturnUnauthorizedOnException() {
        when(cognitoAuthService.startMfaSetup(anyString())).thenThrow(cognitoException());

        ResponseEntity<?> result = controller.mfaSetupStart(Map.of("session", "s1", "email", "user@x.com"));

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void mfaSetupCompleteShouldSetCookiesOnSuccess() {
        when(cognitoAuthService.completeMfaSetup("s", "user@x.com", "123456"))
                .thenReturn(tokensWithSub("sub-3"));

        ResponseEntity<Void> result = controller.mfaSetupComplete(
                new MfaSetupRequest("s", "user@x.com", "123456"), response);

        assertEquals(200, result.getStatusCode().value());
        assertTrue(response.getHeaders("Set-Cookie").stream().anyMatch(c -> c.startsWith("access_token=")));
    }

    @Test
    void mfaSetupCompleteShouldReturn401OnException() {
        when(cognitoAuthService.completeMfaSetup(anyString(), anyString(), anyString()))
                .thenThrow(cognitoException());

        ResponseEntity<Void> result = controller.mfaSetupComplete(
                new MfaSetupRequest("s", "user@x.com", "123456"), response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void mfaVerifyShouldSetCookiesOnSuccess() {
        when(cognitoAuthService.respondToMfaChallenge("s", "user@x.com", "123456"))
                .thenReturn(tokensWithSub("sub-4"));

        ResponseEntity<Void> result = controller.mfaVerify(
                new MfaVerifyRequest("s", "user@x.com", "123456"), response);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void mfaVerifyShouldReturn401OnException() {
        when(cognitoAuthService.respondToMfaChallenge(anyString(), anyString(), anyString()))
                .thenThrow(cognitoException());

        ResponseEntity<Void> result = controller.mfaVerify(
                new MfaVerifyRequest("s", "user@x.com", "123456"), response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void refreshShouldReturn401WhenNoRefreshTokenCookie() {
        ResponseEntity<Void> result = controller.refresh(null, null, null, response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void refreshShouldUseCognitoSubCookieWhenPresent() {
        when(cognitoAuthService.refresh("refresh-tok", "sub-cookie"))
                .thenReturn(tokensWithSub("sub-cookie"));

        ResponseEntity<Void> result = controller.refresh("refresh-tok", "sub-cookie", null, response);

        assertEquals(200, result.getStatusCode().value());
        verify(cognitoAuthService).refresh("refresh-tok", "sub-cookie");
    }

    @Test
    void refreshShouldFallBackToEmailLookupWhenNoCognitoSubCookie() {
        when(userService.findCognitoSubByEmail("user@x.com")).thenReturn(Optional.of("sub-from-email"));
        when(cognitoAuthService.refresh("refresh-tok", "sub-from-email"))
                .thenReturn(tokensWithSub("sub-from-email"));

        ResponseEntity<Void> result = controller.refresh("refresh-tok", null, "user@x.com", response);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void refreshShouldFallBackToRawEmailWhenLookupFails() {
        when(userService.findCognitoSubByEmail("user@x.com")).thenReturn(Optional.empty());
        when(cognitoAuthService.refresh("refresh-tok", "user@x.com"))
                .thenReturn(tokensWithSub("sub-x"));

        ResponseEntity<Void> result = controller.refresh("refresh-tok", null, "user@x.com", response);

        assertEquals(200, result.getStatusCode().value());
        verify(cognitoAuthService).refresh("refresh-tok", "user@x.com");
    }

    @Test
    void refreshShouldReturn401WhenNoCognitoSubAndNoEmail() {
        ResponseEntity<Void> result = controller.refresh("refresh-tok", null, null, response);

        assertEquals(401, result.getStatusCode().value());
        verify(cognitoAuthService, never()).refresh(anyString(), anyString());
    }

    @Test
    void refreshShouldClearCookiesAndReturn401OnException() {
        when(cognitoAuthService.refresh(anyString(), anyString())).thenThrow(cognitoException());

        ResponseEntity<Void> result = controller.refresh("refresh-tok", "sub-cookie", null, response);

        assertEquals(401, result.getStatusCode().value());
        assertTrue(response.getHeaders("Set-Cookie").stream()
                .anyMatch(c -> c.startsWith("access_token=") && c.contains("Max-Age=0")));
    }

    @Test
    void logoutShouldSignOutAndClearCookiesWhenTokenPresent() {
        ResponseEntity<Void> result = controller.logout("access-tok", response);

        assertEquals(200, result.getStatusCode().value());
        verify(cognitoAuthService, times(1)).globalSignOut("access-tok");
        assertTrue(response.getHeaders("Set-Cookie").stream()
                .anyMatch(c -> c.startsWith("refresh_token=") && c.contains("Max-Age=0")));
    }

    @Test
    void logoutShouldIgnoreSignOutFailureAndClearCookies() {
        org.mockito.Mockito.doThrow(cognitoException()).when(cognitoAuthService).globalSignOut(anyString());

        ResponseEntity<Void> result = controller.logout("access-tok", response);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void logoutShouldSkipSignOutWhenNoTokenCookie() {
        ResponseEntity<Void> result = controller.logout(null, response);

        assertEquals(200, result.getStatusCode().value());
        verify(cognitoAuthService, never()).globalSignOut(any(String.class));
    }
}
