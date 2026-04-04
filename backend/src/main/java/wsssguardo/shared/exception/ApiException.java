package wsssguardo.shared.exception;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
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
}
