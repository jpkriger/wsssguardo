package wsssguardo.user.dto;

import wsssguardo.user.domain.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String username,
        String authSub,
        UserRole role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}