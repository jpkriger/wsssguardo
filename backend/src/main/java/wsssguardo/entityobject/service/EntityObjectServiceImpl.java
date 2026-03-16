package wsssguardo.entityobject.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;
import wsssguardo.entityobject.repository.EntityObjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
public class EntityObjectServiceImpl implements EntityObjectService {

    private final EntityObjectRepository repository;

    public EntityObjectServiceImpl(EntityObjectRepository repository) {
        this.repository = repository;
    }

    @Override
    public EntityObjectResponse create(EntityObjectCreateRequest request) {
        EntityObject entityObject = new EntityObject();
        entityObject.setName(request.name());
        entityObject.setCreatedAt(Instant.now());

        EntityObject saved = repository.save(entityObject);
        return toResponse(saved);
    }

    @Override
    public EntityObjectResponse getById(Long id) {
        EntityObject entityObject = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EntityObject", id));

        return toResponse(entityObject);
    }

    @Override
    public List<EntityObjectResponse> listAll() {
        return repository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    private EntityObjectResponse toResponse(EntityObject entityObject) {
        return new EntityObjectResponse(
            entityObject.getId(),
            entityObject.getName(),
            entityObject.getCreatedAt()
        );
    }
}
