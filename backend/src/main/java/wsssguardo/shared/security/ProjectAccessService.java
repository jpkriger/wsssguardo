package wsssguardo.shared.security;

import lombok.RequiredArgsConstructor;
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

    /**
     * Lança 403 se o usuário corrente não tem acesso ao projeto.
     * MANAGER passa sempre; CONSULTANT precisa estar em project_users.
     */
    public void assertAccess(UUID projectId) {
        User user = authenticatedUser.get();
        if (user == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        if (user.getRole() == UserRole.MANAGER) return;
        if (!isMember(user.getId(), projectId)) {
            throw new ApiException("Acesso negado ao projeto", HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Retorna todos os project IDs visíveis ao usuário corrente.
     * MANAGER vê todos; CONSULTANT vê apenas os seus.
     */
    public List<UUID> getAccessibleProjectIds() {
        User user = authenticatedUser.get();
        if (user == null) {
            throw new ApiException("Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        if (user.getRole() == UserRole.MANAGER) {
            return projectRepository.findAll()
                    .stream()
                    .map(p -> p.getId())
                    .toList();
        }
        return projectRepository.findProjectIdsByUserId(user.getId());
    }

    private boolean isMember(UUID userId, UUID projectId) {
        return projectRepository.existsMember(userId, projectId);
    }
}
