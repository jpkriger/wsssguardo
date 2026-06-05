package wsssguardo.shared.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import wsssguardo.user.User;

@Component
@RequestScope
public class AuthenticatedUser {

    private User user;

    public User get() {
        return user;
    }

    public void set(User user) {
        this.user = user;
    }
}
