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
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;
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
                // Primeiro login: busca atributos no Cognito pelo sub (via ListUsers)
                // ListUsers com filtro por sub funciona independente do formato do Username interno
                Map<String, String> attrs = fetchAttributesBySub(sub);
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

    private Map<String, String> fetchAttributesBySub(String sub) {
        log.info(">>> fetchAttributesBySub: userPoolId={}, sub={}", userPoolId, sub);
        try {
            List<UserType> users = cognitoClient.listUsers(
                    ListUsersRequest.builder()
                            .userPoolId(userPoolId)
                            .filter("sub = \"" + sub + "\"")
                            .limit(1)
                            .build()
            ).users();

            log.info(">>> fetchAttributesBySub: ListUsers retornou {} usuário(s)", users.size());

            if (users.isEmpty()) {
                log.warn("Nenhum usuário encontrado no Cognito para sub {}", sub);
                return Map.of();
            }

            Map<String, String> attrs = users.get(0).attributes().stream()
                    .collect(Collectors.toMap(AttributeType::name, AttributeType::value));
            log.info(">>> fetchAttributesBySub: atributos lidos = {}", attrs);
            return attrs;
        } catch (Exception e) {
            log.warn("Não foi possível buscar atributos do Cognito para sub {}: {}", sub, e.getMessage(), e);
            return Map.of();
        }
    }
}
