package wsssguardo.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import wsssguardo.user.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByCognitoSub(String cognitoSub);

    Optional<User> findByEmail(String email);
}
