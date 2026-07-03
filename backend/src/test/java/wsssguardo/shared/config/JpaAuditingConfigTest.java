package wsssguardo.shared.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.AuditorAware;

import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.user.User;

@ExtendWith(MockitoExtension.class)
class JpaAuditingConfigTest {

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Test
    void auditorProviderShouldReturnUserEmailWhenAuthenticated() {
        JpaAuditingConfig config = new JpaAuditingConfig(authenticatedUser);
        User user = new User();
        user.setEmail("user@x.com");
        when(authenticatedUser.get()).thenReturn(user);

        AuditorAware<String> provider = config.auditorProvider();

        assertEquals(Optional.of("user@x.com"), provider.getCurrentAuditor());
    }

    @Test
    void auditorProviderShouldReturnSystemWhenNoUser() {
        JpaAuditingConfig config = new JpaAuditingConfig(authenticatedUser);
        when(authenticatedUser.get()).thenReturn(null);

        AuditorAware<String> provider = config.auditorProvider();

        assertEquals(Optional.of("system"), provider.getCurrentAuditor());
    }

    @Test
    void auditorProviderShouldReturnSystemWhenUserEmailIsNull() {
        JpaAuditingConfig config = new JpaAuditingConfig(authenticatedUser);
        User user = new User();
        user.setEmail(null);
        when(authenticatedUser.get()).thenReturn(user);

        AuditorAware<String> provider = config.auditorProvider();

        assertEquals(Optional.of("system"), provider.getCurrentAuditor());
    }

    @Test
    void auditorProviderShouldReturnSystemWhenAuthenticatedUserThrows() {
        JpaAuditingConfig config = new JpaAuditingConfig(authenticatedUser);
        when(authenticatedUser.get()).thenThrow(new RuntimeException("no request context"));

        AuditorAware<String> provider = config.auditorProvider();

        assertEquals(Optional.of("system"), provider.getCurrentAuditor());
    }
}
