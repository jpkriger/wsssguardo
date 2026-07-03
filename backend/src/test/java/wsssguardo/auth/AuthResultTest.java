package wsssguardo.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AuthResultTest {

    @Test
    void requiresTokensShouldBeTrueOnlyForSuccess() {
        assertTrue(AuthResult.success(new TokenPair("a", "i", "r")).requiresTokens());
        assertFalse(AuthResult.mfaRequired("s").requiresTokens());
    }
}
