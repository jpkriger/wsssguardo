package wsssguardo.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import wsssguardo.user.User;
import wsssguardo.user.service.UserService;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class CognitoUserSyncFilter extends OncePerRequestFilter {

    private final UserService userService;
    private final AuthenticatedUser authenticatedUser;
    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${cognito.user-pool-id:placeholder}")
    private String userPoolId;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            String sub = jwt.getToken().getSubject();

            // Busca local primeiro — evita chamada AWS em todo request
            Optional<User> existing = userService.findByCognitoSubOptional(sub);
            User user;
            if (existing.isPresent()) {
                user = existing.get();
            } else {
                // Primeiro login: busca atributos no Cognito para criar o usuário local
                Map<String, String> attrs = fetchAttributes(sub);
                user = userService.findOrCreateByCognitoSub(
                        sub,
                        attrs.get("email"),
                        attrs.get("given_name"),
                        attrs.get("family_name")
                );
            }
            authenticatedUser.set(user);
        }
        chain.doFilter(request, response);
    }

    private Map<String, String> fetchAttributes(String sub) {
        try {
            List<AttributeType> attrs = cognitoClient.adminGetUser(
                    AdminGetUserRequest.builder()
                            .userPoolId(userPoolId)
                            .username(sub)
                            .build()
            ).userAttributes();
            return attrs.stream()
                    .collect(Collectors.toMap(AttributeType::name, AttributeType::value));
        } catch (Exception e) {
            log.warn("Não foi possível buscar atributos do Cognito para sub {}: {}", sub, e.getMessage());
            return Map.of();
        }
    }
}
