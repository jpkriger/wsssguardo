package wsssguardo.shared.exception;

import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining("; "));

        return respond(new ApiException(message, HttpStatus.BAD_REQUEST), request);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Object> handleApiException(ApiException ex, HttpServletRequest request) {
        return respond(ex, request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Object> handleNoHandler(NoHandlerFoundException ex, HttpServletRequest request) {
        return respond(new ApiException("No endpoint: " + ex.getRequestURL(), HttpStatus.NOT_FOUND), request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Object> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return respond(new ApiException(ex.getMessage(), HttpStatus.METHOD_NOT_ALLOWED), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return respond(new ApiException("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR), request);
    }

    private ResponseEntity<Object> respond(ApiException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatusCode()).body(
            java.util.Map.of(
                "status", ex.getStatus(),
                "error", ex.getError() != null ? ex.getError() : "Error",
                "message", ex.getMessage() != null ? ex.getMessage() : "",
                "timestamp", ex.getTimestamp().toString(),
                "path", request.getRequestURI()
            )
        );
    }
}
