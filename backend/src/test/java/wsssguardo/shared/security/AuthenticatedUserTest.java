package wsssguardo.shared.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

import wsssguardo.user.User;

class AuthenticatedUserTest {

    @Test
    void getShouldReturnNullBeforeSet() {
        AuthenticatedUser holder = new AuthenticatedUser();

        assertNull(holder.get());
    }

    @Test
    void setShouldMakeUserAvailableViaGet() {
        AuthenticatedUser holder = new AuthenticatedUser();
        User user = new User();

        holder.set(user);

        assertEquals(user, holder.get());
    }
}
