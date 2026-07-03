package wsssguardo.shared.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;

@TestPropertySource(properties = "security.auth.disabled=false")
class SecurityConfigEnabledTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void protectedEndpointShouldReturnUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginEndpointShouldBeReachableWithoutAuthentication() throws Exception {
        // permitAll: chega no controller (400 de validação), não barra com 401/403 antes disso
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void swaggerUiShouldNotBeAccessibleWithoutAuthentication() throws Exception {
        // denyAll() + requisição anônima -> a entry point do resource server responde 401
        // (403 só ocorreria se houvesse um principal autenticado sendo negado).
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isUnauthorized());
    }
}
