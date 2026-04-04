package wsssguardo.entityobject.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;
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
    public EntityObjectResponseDTO create(EntityObjectRequestDTO request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Override
    @Transactional(readOnly = true)
    public EntityObjectResponseDTO getById(UUID id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("EntityObject", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EntityObjectResponseDTO> listAll() {
        return repository.findAll().stream()
            .map(mapper::toResponse)
            .toList();
    }
}
