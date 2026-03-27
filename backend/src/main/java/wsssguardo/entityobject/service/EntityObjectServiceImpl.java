package wsssguardo.entityobject.service;

import java.util.List;

import org.springframework.stereotype.Service;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;
import wsssguardo.entityobject.mapper.EntityObjectMapper;
import wsssguardo.entityobject.repository.EntityObjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
public class EntityObjectServiceImpl implements EntityObjectService {

    private final EntityObjectRepository repository;
    private final EntityObjectMapper mapper;

    public EntityObjectServiceImpl(EntityObjectRepository repository, EntityObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public EntityObjectResponse create(EntityObjectCreateRequest request) {
        EntityObject entityObject = mapper.toEntity(request);
        EntityObject saved = repository.save(entityObject);
        return mapper.toResponse(saved);
    }

    @Override
    public EntityObjectResponse getById(Long id) {
        EntityObject entityObject = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EntityObject", id));

        return mapper.toResponse(entityObject);
    }

    @Override
    public List<EntityObjectResponse> listAll() {
        return repository.findAll().stream()
            .map(mapper::toResponse)
            .toList();
    }
}
