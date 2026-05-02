package wsssguardo.entityobject.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.requestdto.EntityObjectUpdateRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;

@Component
public class EntityObjectMapper {

    public EntityObject toEntity(EntityObjectRequestDTO request) {
        EntityObject entity = new EntityObject();
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setReference(request.reference());
        return entity;
    }

    public void applyUpdate(EntityObjectUpdateRequestDTO request, EntityObject entity) {
        if (request.name() != null) entity.setName(request.name());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.reference() != null) entity.setReference(request.reference());
    }

    public EntityObjectResponseDTO toResponse(EntityObject entity) {
        return new EntityObjectResponseDTO(
            entity.getId(),
            entity.getName(),
            entity.getDescription(),
            entity.getReference(),
            entity.getCreatedAt()
        );
    }
}
