package wsssguardo.user.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.shared.security.ProjectAccessService;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.dto.UserResponse;
import wsssguardo.user.service.UserService;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService service;

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Mock
    private ProjectAccessService projectAccessService;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(service, authenticatedUser, projectAccessService);
    }

    private User user(UUID id, UserRole role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }

    @Test
    void listAllShouldAssertManagerAndDelegate() {
        when(service.listAll()).thenReturn(List.of());

        ResponseEntity<List<UserResponse>> result = controller.listAll();

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void getUserByIdShouldThrowWhenNotAuthenticated() {
        when(authenticatedUser.get()).thenReturn(null);

        assertThrows(ApiException.class, () -> controller.getUserById(UUID.randomUUID()));
    }

    @Test
    void getUserByIdShouldAllowSelf() {
        UUID id = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(user(id, UserRole.CONSULTANT));
        when(service.findById(id)).thenReturn(new UserResponse(id, "n", "l", "e", UserRole.CONSULTANT, null, null));

        ResponseEntity<UserResponse> result = controller.getUserById(id);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void getUserByIdShouldAllowManagerForOtherUser() {
        UUID managerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(user(managerId, UserRole.MANAGER));
        when(service.findById(otherId)).thenReturn(new UserResponse(otherId, "n", "l", "e", UserRole.CONSULTANT, null, null));

        ResponseEntity<UserResponse> result = controller.getUserById(otherId);

        assertEquals(200, result.getStatusCode().value());
    }

    @Test
    void getUserByIdShouldThrowWhenNotSelfAndNotManager() {
        UUID currentId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(user(currentId, UserRole.CONSULTANT));

        assertThrows(ApiException.class, () -> controller.getUserById(otherId));
    }

    @Test
    void getMeShouldReturn401WhenNotAuthenticated() {
        when(authenticatedUser.get()).thenReturn(null);

        ResponseEntity<UserResponse> result = controller.getMe();

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void getMeShouldReturnMappedUserWhenAuthenticated() {
        User u = user(UUID.randomUUID(), UserRole.CONSULTANT);
        when(authenticatedUser.get()).thenReturn(u);
        when(service.toResponse(u)).thenReturn(new UserResponse(u.getId(), "n", "l", "e", UserRole.CONSULTANT, null, null));

        ResponseEntity<UserResponse> result = controller.getMe();

        assertEquals(200, result.getStatusCode().value());
    }
}
