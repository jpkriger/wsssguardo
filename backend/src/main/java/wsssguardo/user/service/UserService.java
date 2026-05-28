package wsssguardo.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.dto.UserResponse;
import wsssguardo.user.repository.UserRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;

    public UserResponse findById(UUID id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getAuthSub(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}