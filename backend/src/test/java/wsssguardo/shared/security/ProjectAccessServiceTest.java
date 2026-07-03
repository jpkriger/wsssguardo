package wsssguardo.shared.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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
import org.springframework.test.util.ReflectionTestUtils;

import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;

@ExtendWith(MockitoExtension.class)
class ProjectAccessServiceTest {

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Mock
    private ProjectRepository projectRepository;

    private ProjectAccessService service;

    @BeforeEach
    void setUp() {
        service = new ProjectAccessService(authenticatedUser, projectRepository);
        ReflectionTestUtils.setField(service, "authDisabled", false);
    }

    private User user(UserRole role) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("user@x.com");
        u.setRole(role);
        return u;
    }

    @Test
    void assertManagerShouldPassWhenAuthDisabled() {
        ReflectionTestUtils.setField(service, "authDisabled", true);

        assertDoesNotThrow(() -> service.assertManager());
    }

    @Test
    void assertManagerShouldPassForManager() {
        when(authenticatedUser.get()).thenReturn(user(UserRole.MANAGER));

        assertDoesNotThrow(() -> service.assertManager());
    }

    @Test
    void assertManagerShouldThrowForNonManager() {
        when(authenticatedUser.get()).thenReturn(user(UserRole.CONSULTANT));

        assertThrows(ApiException.class, () -> service.assertManager());
    }

    @Test
    void assertManagerShouldThrowWhenNoUser() {
        when(authenticatedUser.get()).thenReturn(null);

        assertThrows(ApiException.class, () -> service.assertManager());
    }

    @Test
    void assertAccessShouldPassWhenAuthDisabled() {
        ReflectionTestUtils.setField(service, "authDisabled", true);

        assertDoesNotThrow(() -> service.assertAccess(UUID.randomUUID()));
    }

    @Test
    void assertAccessShouldThrowWhenNoUser() {
        when(authenticatedUser.get()).thenReturn(null);

        assertThrows(ApiException.class, () -> service.assertAccess(UUID.randomUUID()));
    }

    @Test
    void assertAccessShouldPassForManagerRegardlessOfMembership() {
        when(authenticatedUser.get()).thenReturn(user(UserRole.MANAGER));

        assertDoesNotThrow(() -> service.assertAccess(UUID.randomUUID()));
    }

    @Test
    void assertAccessShouldPassForMember() {
        User u = user(UserRole.CONSULTANT);
        UUID projectId = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(u);
        when(projectRepository.existsMember(u.getId(), projectId)).thenReturn(true);

        assertDoesNotThrow(() -> service.assertAccess(projectId));
    }

    @Test
    void assertAccessShouldThrowForNonMember() {
        User u = user(UserRole.CONSULTANT);
        UUID projectId = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(u);
        when(projectRepository.existsMember(u.getId(), projectId)).thenReturn(false);

        assertThrows(ApiException.class, () -> service.assertAccess(projectId));
    }

    @Test
    void getAccessibleProjectIdsShouldReturnAllWhenAuthDisabled() {
        ReflectionTestUtils.setField(service, "authDisabled", true);
        Project p = new Project();
        UUID projectId = UUID.randomUUID();
        p.setId(projectId);
        when(projectRepository.findAll()).thenReturn(List.of(p));

        List<UUID> result = service.getAccessibleProjectIds();

        assertEquals(List.of(projectId), result);
    }

    @Test
    void getAccessibleProjectIdsShouldThrowWhenNoUser() {
        when(authenticatedUser.get()).thenReturn(null);

        assertThrows(ApiException.class, () -> service.getAccessibleProjectIds());
    }

    @Test
    void getAccessibleProjectIdsShouldReturnAllForManager() {
        when(authenticatedUser.get()).thenReturn(user(UserRole.MANAGER));
        Project p = new Project();
        UUID projectId = UUID.randomUUID();
        p.setId(projectId);
        when(projectRepository.findAll()).thenReturn(List.of(p));

        List<UUID> result = service.getAccessibleProjectIds();

        assertEquals(List.of(projectId), result);
    }

    @Test
    void getAccessibleProjectIdsShouldReturnMemberProjectsForConsultant() {
        User u = user(UserRole.CONSULTANT);
        UUID projectId = UUID.randomUUID();
        when(authenticatedUser.get()).thenReturn(u);
        when(projectRepository.findProjectIdsByUserId(u.getId())).thenReturn(List.of(projectId));

        List<UUID> result = service.getAccessibleProjectIds();

        assertEquals(List.of(projectId), result);
    }

    @Test
    void getUsernameShouldReturnEmailWhenUserPresent() {
        when(authenticatedUser.get()).thenReturn(user(UserRole.CONSULTANT));

        assertEquals("user@x.com", service.getUsername());
    }

    @Test
    void getUsernameShouldReturnSystemWhenNoUser() {
        when(authenticatedUser.get()).thenReturn(null);

        assertEquals("system", service.getUsername());
    }

    @Test
    void getUsernameShouldReturnSystemWhenEmailIsNull() {
        User u = user(UserRole.CONSULTANT);
        u.setEmail(null);
        when(authenticatedUser.get()).thenReturn(u);

        assertEquals("system", service.getUsername());
    }
}
