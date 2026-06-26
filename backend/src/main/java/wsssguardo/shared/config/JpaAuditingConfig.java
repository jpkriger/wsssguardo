package wsssguardo.shared.config;

import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import lombok.RequiredArgsConstructor;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.user.User;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@RequiredArgsConstructor
public class JpaAuditingConfig {

    private final AuthenticatedUser authenticatedUser;

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                User user = authenticatedUser.get();
                if (user != null && user.getEmail() != null) {
                    return Optional.of(user.getEmail());
                }
            } catch (Exception ignored) {
                // Fall back to system when there is no authenticated context.
            }
            return Optional.of("system");
        };
    }
}
