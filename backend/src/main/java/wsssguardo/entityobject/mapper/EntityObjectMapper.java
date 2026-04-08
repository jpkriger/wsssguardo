package wsssguardo.entityobject.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;

@Component
public class EntityObjectMapper {

    public EntityObject toEntity(EntityObjectRequestDTO request) {
        EntityObject entity = new EntityObject();
        entity.setName(request.name());
        return entity;
    }

    public EntityObjectResponseDTO toResponse(EntityObject entity) {
        return new EntityObjectResponseDTO(entity.getId(), entity.getName(), entity.getCreatedAt());
    }
}
