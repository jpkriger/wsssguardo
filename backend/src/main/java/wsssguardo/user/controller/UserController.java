package wsssguardo.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.shared.security.ProjectAccessService;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.dto.UserResponse;
import wsssguardo.user.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;
    private final AuthenticatedUser authenticatedUser;
    private final ProjectAccessService projectAccessService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> listAll() {
        projectAccessService.assertManager();
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        var current = authenticatedUser.get();
        boolean isSelf = current.getId().equals(id);
        boolean isManager = current.getRole() == UserRole.MANAGER;
        if (!isSelf && !isManager) {
            throw new ApiException("Acesso negado", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe() {
        if (authenticatedUser.get() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(service.toResponse(authenticatedUser.get()));
    }
}
