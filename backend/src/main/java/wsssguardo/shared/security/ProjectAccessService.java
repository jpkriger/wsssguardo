package wsssguardo.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final AuthenticatedUser authenticatedUser;
    private final ProjectRepository projectRepository;

    @Value("${security.auth.disabled:false}")
    private boolean authDisabled;

    public void assertManager() {
        if (authDisabled) return;
        User user = authenticatedUser.get();
        if (user == null || user.getRole() != UserRole.MANAGER) {
            throw new ApiException("Apenas gestores podem realizar esta operação", HttpStatus.FORBIDDEN);
        }
    }

    public void assertAccess(UUID projectId) {
        if (authDisabled) return;
        User user = authenticatedUser.get();
        if (user == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        if (user.getRole() == UserRole.MANAGER) return;
        if (!isMember(user.getId(), projectId)) {
            throw new ApiException("Acesso negado ao projeto", HttpStatus.FORBIDDEN);
        }
    }

    public List<UUID> getAccessibleProjectIds() {
        if (authDisabled) {
            return projectRepository.findAll().stream().map(p -> p.getId()).toList();
        }
        User user = authenticatedUser.get();
        if (user == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        if (user.getRole() == UserRole.MANAGER) {
            return projectRepository.findAll().stream().map(p -> p.getId()).toList();
        }
        return projectRepository.findProjectIdsByUserId(user.getId());
    }

    public String getUsername() {
        User user = authenticatedUser.get();
        if (user == null || user.getEmail() == null) {
            return "system";
        }
        return user.getEmail();
    }

    private boolean isMember(UUID userId, UUID projectId) {
        return projectRepository.existsMember(userId, projectId);
    }
}
