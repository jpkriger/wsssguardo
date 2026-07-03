package wsssguardo.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AliasExistsException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CodeMismatchException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;
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

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    @Mock
    private CognitoAuthService cognitoAuthService;

    @Mock
    private UserService userService;

    @Mock
    private AuthenticatedUser authenticatedUser;

    private AccountController controller;

    @BeforeEach
    void setUp() {
        controller = new AccountController(cognitoAuthService, userService, authenticatedUser);
    }

    private User user() {
        User u = new User();
        u.setFirstName("Ana");
        u.setLastName("Silva");
        u.setEmail("ana@x.com");
        u.setCognitoSub("sub-123");
        return u;
    }

    @Test
    void changePasswordShouldReturnNoContentWhenTokenPresent() {
        ResponseEntity<Void> result = controller.changePassword("access-tok",
                new ChangePasswordRequest("old", "new-password"));

        assertEquals(204, result.getStatusCode().value());
        verify(cognitoAuthService).changePassword("access-tok", "old", "new-password");
    }

    @Test
    void changePasswordShouldThrowWhenNoToken() {
        assertThrows(ApiException.class, () ->
                controller.changePassword(null, new ChangePasswordRequest("old", "new-password")));
    }

    @Test
    void changePasswordShouldMapNotAuthorizedException() {
        doThrow(NotAuthorizedException.builder().message("bad").build())
                .when(cognitoAuthService).changePassword(anyString(), anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.changePassword("access-tok", new ChangePasswordRequest("wrong", "new-password")));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void changePasswordShouldMapInvalidPasswordException() {
        doThrow(InvalidPasswordException.builder().message("weak").build())
                .when(cognitoAuthService).changePassword(anyString(), anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.changePassword("access-tok", new ChangePasswordRequest("old", "weak")));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void changePasswordShouldMapLimitExceededException() {
        doThrow(LimitExceededException.builder().message("limit").build())
                .when(cognitoAuthService).changePassword(anyString(), anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.changePassword("access-tok", new ChangePasswordRequest("old", "new-password")));
        assertEquals(429, ex.getStatus());
    }

    @Test
    void changePasswordShouldMapGenericCognitoException() {
        doThrow(cognitoException()).when(cognitoAuthService)
                .changePassword(anyString(), anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.changePassword("access-tok", new ChangePasswordRequest("old", "new-password")));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void updateProfileShouldUpdateNameAndEmailWhenBothChanged() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);

        ResponseEntity<Void> result = controller.updateProfile(
                new UpdateProfileRequest("Novo", "Nome", "novo@x.com"));

        assertEquals(204, result.getStatusCode().value());
        verify(cognitoAuthService).updateName("sub-123", "Novo", "Nome");
        verify(cognitoAuthService).updateEmail("sub-123", "novo@x.com");
        verify(userService).updateName(u, "Novo", "Nome");
        verify(userService).updateEmail(u, "novo@x.com");
    }

    @Test
    void updateProfileShouldSkipCognitoCallsWhenNothingChanged() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);

        controller.updateProfile(new UpdateProfileRequest("Ana", "Silva", "ana@x.com"));

        verify(cognitoAuthService, never()).updateName(anyString(), anyString(), anyString());
        verify(cognitoAuthService, never()).updateEmail(anyString(), anyString());
        verify(userService, never()).updateName(org.mockito.ArgumentMatchers.any(), anyString(), anyString());
        verify(userService, never()).updateEmail(org.mockito.ArgumentMatchers.any(), anyString());
    }

    @Test
    void updateProfileShouldThrowWhenNotAuthenticated() {
        when(authenticatedUser.get()).thenReturn(null);

        assertThrows(ApiException.class, () ->
                controller.updateProfile(new UpdateProfileRequest("Ana", "Silva", "ana@x.com")));
    }

    @Test
    void updateProfileShouldMapAliasExistsException() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);
        doThrow(AliasExistsException.builder().message("dup").build())
                .when(cognitoAuthService).updateEmail(anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.updateProfile(new UpdateProfileRequest("Ana", "Silva", "dup@x.com")));
        assertEquals(409, ex.getStatus());
    }

    @Test
    void updateProfileShouldMapGenericCognitoExceptionOnNameUpdate() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);
        doThrow(cognitoException()).when(cognitoAuthService)
                .updateName(anyString(), anyString(), anyString());

        assertThrows(ApiException.class, () ->
                controller.updateProfile(new UpdateProfileRequest("Novo", "Silva", "ana@x.com")));
    }

    @Test
    void mfaStatusShouldReturnEnabledTrue() {
        when(cognitoAuthService.isMfaEnabled("access-tok")).thenReturn(true);

        ResponseEntity<MfaStatusResponse> result = controller.mfaStatus("access-tok");

        assertTrue(result.getBody().enabled());
    }

    @Test
    void mfaStatusShouldThrowWhenNoToken() {
        assertThrows(ApiException.class, () -> controller.mfaStatus(null));
    }

    @Test
    void mfaStatusShouldMapCognitoException() {
        when(cognitoAuthService.isMfaEnabled(anyString())).thenThrow(cognitoException());

        assertThrows(ApiException.class, () -> controller.mfaStatus("access-tok"));
    }

    @Test
    void mfaSetupShouldReturnOtpauthUri() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);
        when(cognitoAuthService.startMfaDeviceSetup("access-tok")).thenReturn("SECRET");

        ResponseEntity<MfaDeviceSetupResponse> result = controller.mfaSetup("access-tok");

        assertTrue(result.getBody().otpauthUri().contains("SECRET"));
    }

    @Test
    void mfaSetupShouldThrowWhenNoToken() {
        assertThrows(ApiException.class, () -> controller.mfaSetup(null));
    }

    @Test
    void mfaSetupShouldMapCognitoException() {
        User u = user();
        when(authenticatedUser.get()).thenReturn(u);
        when(cognitoAuthService.startMfaDeviceSetup(anyString())).thenThrow(cognitoException());

        assertThrows(ApiException.class, () -> controller.mfaSetup("access-tok"));
    }

    @Test
    void mfaVerifyShouldReturnNoContentOnSuccess() {
        ResponseEntity<Void> result = controller.mfaVerify("access-tok", new MfaDeviceVerifyRequest("123456"));

        assertEquals(204, result.getStatusCode().value());
    }

    @Test
    void mfaVerifyShouldThrowWhenNoToken() {
        assertThrows(ApiException.class, () ->
                controller.mfaVerify(null, new MfaDeviceVerifyRequest("123456")));
    }

    @Test
    void mfaVerifyShouldMapCodeMismatchException() {
        doThrow(CodeMismatchException.builder().message("bad code").build())
                .when(cognitoAuthService).verifyAndEnableMfaDevice(anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () ->
                controller.mfaVerify("access-tok", new MfaDeviceVerifyRequest("000000")));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void mfaVerifyShouldMapGenericCognitoException() {
        doThrow(cognitoException()).when(cognitoAuthService)
                .verifyAndEnableMfaDevice(anyString(), anyString());

        assertThrows(ApiException.class, () ->
                controller.mfaVerify("access-tok", new MfaDeviceVerifyRequest("123456")));
    }

    private CognitoIdentityProviderException cognitoException() {
        return (CognitoIdentityProviderException) CognitoIdentityProviderException.builder()
                .message("boom")
                .awsErrorDetails(AwsErrorDetails.builder().errorCode("InternalErrorException").errorMessage("boom").build())
                .build();
    }
}
