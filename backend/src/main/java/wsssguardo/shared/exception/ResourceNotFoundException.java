package wsssguardo.shared.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String resourceName, Object id) {
        super(resourceName + " not found for id: " + id, HttpStatus.NOT_FOUND);
    }
}
