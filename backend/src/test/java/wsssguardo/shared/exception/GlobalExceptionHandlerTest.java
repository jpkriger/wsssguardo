package wsssguardo.shared.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.servlet.http.HttpServletRequest;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private HttpServletRequest request;

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleApiExceptionShouldReturnStructuredBody() {
        when(request.getRequestURI()).thenReturn("/api/projects/1");
        ApiException ex = new ApiException("boom", HttpStatus.BAD_REQUEST);

        ResponseEntity<Object> response = handler.handleApiException(ex, request);

        assertEquals(400, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("boom", body.get("message"));
        assertEquals("/api/projects/1", body.get("path"));
    }

    @Test
    void handleNoHandlerShouldReturn404() throws Exception {
        when(request.getRequestURI()).thenReturn("/nope");
        NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/nope", null);

        ResponseEntity<Object> response = handler.handleNoHandler(ex, request);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void handleMethodNotAllowedShouldReturn405() {
        when(request.getRequestURI()).thenReturn("/api/projects");
        HttpRequestMethodNotSupportedException ex =
                new HttpRequestMethodNotSupportedException("DELETE", (java.util.Collection<String>) null);

        ResponseEntity<Object> response = handler.handleMethodNotAllowed(ex, request);

        assertEquals(405, response.getStatusCode().value());
    }

    @Test
    void handleUnexpectedShouldReturn500AndLog() {
        when(request.getRequestURI()).thenReturn("/api/projects");
        when(request.getMethod()).thenReturn("GET");

        ResponseEntity<Object> response = handler.handleUnexpected(new RuntimeException("boom"), request);

        assertEquals(500, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Internal server error", body.get("message"));
    }
}
