package wsssguardo.shared.exception;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.HttpStatus;

@JsonIgnoreProperties({"cause", "stackTrace", "suppressed", "localizedMessage"})
public class ApiException extends RuntimeException {

    private final int status;
    private final String error;
    private final Instant timestamp = Instant.now();
    private String path;

    public ApiException(String message, HttpStatus statusCode) {
        super(message);
        this.status = statusCode.value();
        this.error = statusCode.getReasonPhrase();
    }

    @JsonIgnore
    public HttpStatus getStatusCode() {
        return HttpStatus.valueOf(status);
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
