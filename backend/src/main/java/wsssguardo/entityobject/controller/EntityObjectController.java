package wsssguardo.entityobject.controller;

import java.net.URI;
import java.util.List;

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

import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;
import wsssguardo.entityobject.service.EntityObjectService;

@Tag(name = "EntityObject", description = "Operações de EntityObject")
@RestController
@RequestMapping("/api/entity-objects")
public class EntityObjectController {

    private final EntityObjectService service;

    public EntityObjectController(EntityObjectService service) {
        this.service = service;
    }

    @Operation(summary = "Criar EntityObject")
    @PostMapping
    public ResponseEntity<EntityObjectResponse> create(@Valid @RequestBody EntityObjectCreateRequest request) {
        EntityObjectResponse created = service.create(request);
        return ResponseEntity
            .created(URI.create("/api/entity-objects/" + created.id()))
            .body(created);
    }

    @Operation(summary = "Buscar EntityObject por ID")
    @GetMapping("/{id}")
    public EntityObjectResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @Operation(summary = "Listar todos os EntityObjects")
    @GetMapping
    public List<EntityObjectResponse> listAll() {
        return service.listAll();
    }
}
