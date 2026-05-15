package wsssguardo.user.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.user.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    
}
