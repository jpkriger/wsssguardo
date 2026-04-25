package wsssguardo.shared.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    // TODO: create a JWT filter that validates tokens issued by AWS Cognito.
    //       The filter should:
    //       - extract the Bearer token from the Authorization header
    //       - validate the token signature against the Cognito JWKS endpoint:
    //         https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
    //       - extract claims (sub, email, groups) and populate the SecurityContext
    //       - reject requests with invalid or expired tokens with 401
    //       Once implemented, replace permitAll() with authenticated() and add the filter:
    //         .addFilterBefore(cognitoJwtFilter(), UsernamePasswordAuthenticationFilter.class)

    @Value("${security.auth.disabled:false}")
    private boolean authDisabled;

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(Customizer.withDefaults()).disable());

        if (authDisabled) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        }

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
