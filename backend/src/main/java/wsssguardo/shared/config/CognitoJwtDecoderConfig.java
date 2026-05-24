package wsssguardo.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;


@Configuration
public class CognitoJwtDecoderConfig {

    @Value("${cognito.region:us-east-2}")
    private String region;

    @Value("${cognito.user-pool-id:placeholder}")
    private String userPoolId;

    @Value("${cognito.client-id:placeholder}")
    private String clientId;

    // Só cria o JwtDecoder (e faz o fetch do JWKS) quando auth está ativa.
    // Com auth desabilitada, o bean não existe e o Spring não tenta contatar a AWS.
    @Bean
    @ConditionalOnProperty(name = "security.auth.disabled", havingValue = "false", matchIfMissing = true)
    public JwtDecoder cognitoJwtDecoder() {
        String issuerUri = "https://cognito-idp." + region + ".amazonaws.com/" + userPoolId;

        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuerUri);

        // Cognito access tokens usam "client_id", não "aud"
        OAuth2TokenValidator<Jwt> clientIdValidator = new JwtClaimValidator<String>(
                "client_id", clientId::equals);
        OAuth2TokenValidator<Jwt> combined = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerUri), clientIdValidator);

        decoder.setJwtValidator(combined);
        return decoder;
    }
}
