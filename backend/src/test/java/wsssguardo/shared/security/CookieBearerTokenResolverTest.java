package wsssguardo.shared.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class CookieBearerTokenResolverTest {

    private final CookieBearerTokenResolver resolver = new CookieBearerTokenResolver("access_token");

    @Test
    void resolveShouldReturnNullWhenNoCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertNull(resolver.resolve(request));
    }

    @Test
    void resolveShouldReturnNullWhenCookieMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("other_cookie", "value"));

        assertNull(resolver.resolve(request));
    }

    @Test
    void resolveShouldReturnCookieValueWhenPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("other", "x"), new Cookie("access_token", "the-jwt"));

        assertEquals("the-jwt", resolver.resolve(request));
    }
}
