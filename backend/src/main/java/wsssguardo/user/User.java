package wsssguardo.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import wsssguardo.shared.domain.BaseEntity;
import wsssguardo.user.domain.UserRole;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class User extends BaseEntity {

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 320, unique = true)
    private String email;

    @Column(name = "cognito_sub", length = 36, unique = true)
    private String cognitoSub;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
}
