package wsssguardo.entityobject.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;
import wsssguardo.entityobject.service.EntityObjectService;
import wsssguardo.shared.openapi.ApiCreate;
import wsssguardo.shared.openapi.ApiGetById;
import wsssguardo.shared.openapi.ApiListAll;

@Tag(name = "EntityObject", description = "EntityObject operations")
@RestController
@RequestMapping("/api/entity-objects")
public class EntityObjectController {

    private final EntityObjectService service;

    public EntityObjectController(EntityObjectService service) {
        this.service = service;
    }

    @ApiCreate
    @PostMapping
    public ResponseEntity<EntityObjectResponseDTO> create(@Valid @RequestBody EntityObjectRequestDTO request) {
        EntityObjectResponseDTO created = service.create(request);
        return ResponseEntity.created(URI.create("/api/entity-objects/" + created.id())).body(created);
    }

    @ApiGetById
    @GetMapping("/{id}")
    public ResponseEntity<EntityObjectResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @ApiListAll
    @GetMapping
    public List<EntityObjectResponseDTO> listAll() {
        return service.listAll();
    }
}
