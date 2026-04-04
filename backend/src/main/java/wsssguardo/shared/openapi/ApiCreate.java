package wsssguardo.shared.openapi;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Operation(summary = "Create resource")
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "Created successfully"),
    @ApiResponse(responseCode = "400", description = "Validation error")
})
public @interface ApiCreate {
    String summary() default "Create resource";
}
