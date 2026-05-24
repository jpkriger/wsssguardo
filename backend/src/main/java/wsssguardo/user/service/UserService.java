package wsssguardo.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.dto.UserResponse;
import wsssguardo.user.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;

    public UserResponse findById(UUID id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    public UserResponse findByCognitoSub(String cognitoSub) {
        User user = repository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> new ResourceNotFoundException("User", cognitoSub));
        return toResponse(user);
    }

    public Optional<User> findByCognitoSubOptional(String cognitoSub) {
        return repository.findByCognitoSub(cognitoSub);
    }

    public Optional<String> findCognitoSubByEmail(String email) {
        return repository.findByEmail(email).map(User::getCognitoSub);
    }

    @Transactional
    public User findOrCreateByCognitoSub(String cognitoSub, String email,
                                         String firstName, String lastName) {
        return repository.findByCognitoSub(cognitoSub).orElseGet(() ->
                repository.save(User.builder()
                        .cognitoSub(cognitoSub)
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .role(UserRole.CONSULTANT)
                        .build())
        );
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
