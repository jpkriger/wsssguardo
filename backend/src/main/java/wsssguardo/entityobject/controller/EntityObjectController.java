package wsssguardo.entityobject.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wsssguardo.entityobject.dto.requestdto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponse;
import wsssguardo.entityobject.service.EntityObjectService;

@Tag(name = "EntityObject", description = "EntityObject operations")
@RestController
@RequestMapping("/api/entity-objects")
public class EntityObjectController {

    private final EntityObjectService service;

    public EntityObjectController(EntityObjectService service) {
        this.service = service;
    }

    @Operation(summary = "Create EntityObject")
    @PostMapping
    public ResponseEntity<EntityObjectResponse> create(@Valid @RequestBody EntityObjectCreateRequest request) {
        EntityObjectResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/entity-objects/" + created.id())).body(created);
    }

    @Operation(summary = "Get EntityObject by ID")
    @GetMapping("/{id}")
    public ResponseEntity<EntityObjectResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @Operation(summary = "List all EntityObjects")
    @GetMapping
    public List<EntityObjectResponse> listAll() {
        return service.listAll();
    }
}