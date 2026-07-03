package wsssguardo.shared.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import jakarta.servlet.FilterChain;
import wsssguardo.user.User;
import wsssguardo.user.service.UserService;

@ExtendWith(MockitoExtension.class)
class CognitoUserSyncFilterTest {

    @Mock
    private UserService userService;

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Mock
    private CognitoIdentityProviderClient cognitoClient;

    @Mock
    private FilterChain chain;

    private CognitoUserSyncFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CognitoUserSyncFilter(userService, authenticatedUser, cognitoClient);
        ReflectionTestUtils.setField(filter, "userPoolId", "pool-1");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Jwt jwt(String sub) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", sub)
                .subject(sub)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    @Test
    void doFilterShouldSkipWhenAuthenticationIsNotJwt() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user", "pass"));
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        verify(authenticatedUser, never()).set(any());
        verify(chain).doFilter(req, res);
    }

    @Test
    void doFilterShouldUseExistingLocalUserWhenFound() throws Exception {
        Jwt token = jwt("sub-1");
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(token));
        User existing = new User();
        existing.setCognitoSub("sub-1");
        when(userService.findByCognitoSubOptional("sub-1")).thenReturn(Optional.of(existing));

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        verify(authenticatedUser).set(existing);
        verify(cognitoClient, never()).listUsers(any(ListUsersRequest.class));
        verify(chain).doFilter(req, res);
    }

    @Test
    void doFilterShouldFetchAttributesAndCreateUserWhenNotFoundLocally() throws Exception {
        Jwt token = jwt("sub-2");
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token));
        when(userService.findByCognitoSubOptional("sub-2")).thenReturn(Optional.empty());

        UserType cognitoUser = UserType.builder()
                .attributes(
                        AttributeType.builder().name("email").value("new@x.com").build(),
                        AttributeType.builder().name("given_name").value("New").build(),
                        AttributeType.builder().name("family_name").value("User").build())
                .build();
        when(cognitoClient.listUsers(any(ListUsersRequest.class)))
                .thenReturn(ListUsersResponse.builder().users(List.of(cognitoUser)).build());

        User created = new User();
        when(userService.findOrCreateByCognitoSub("sub-2", "new@x.com", "New", "User"))
                .thenReturn(created);

        filter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        verify(userService).findOrCreateByCognitoSub("sub-2", "new@x.com", "New", "User");
        verify(authenticatedUser).set(created);
    }

    @Test
    void doFilterShouldCreateUserWithNullAttributesWhenCognitoReturnsNoUsers() throws Exception {
        Jwt token = jwt("sub-3");
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token));
        when(userService.findByCognitoSubOptional("sub-3")).thenReturn(Optional.empty());
        when(cognitoClient.listUsers(any(ListUsersRequest.class)))
                .thenReturn(ListUsersResponse.builder().users(List.of()).build());

        User created = new User();
        when(userService.findOrCreateByCognitoSub("sub-3", null, null, null)).thenReturn(created);

        filter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        verify(userService).findOrCreateByCognitoSub("sub-3", null, null, null);
    }

    @Test
    void doFilterShouldHandleCognitoExceptionGracefully() throws Exception {
        Jwt token = jwt("sub-4");
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token));
        when(userService.findByCognitoSubOptional("sub-4")).thenReturn(Optional.empty());
        when(cognitoClient.listUsers(any(ListUsersRequest.class)))
                .thenThrow(new RuntimeException("cognito down"));

        User created = new User();
        when(userService.findOrCreateByCognitoSub("sub-4", null, null, null)).thenReturn(created);

        filter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        verify(authenticatedUser).set(created);
        verify(chain, times(1)).doFilter(any(), any());
    }
}
