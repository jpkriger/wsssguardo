package wsssguardo.entityobject.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.requestdto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponse;

@Component
public class EntityObjectMapper {

    public EntityObject toEntity(EntityObjectCreateRequest request) {
        EntityObject entity = new EntityObject();
        entity.setName(request.name());
        return entity;
    }

    public EntityObjectResponse toResponse(EntityObject entity) {
        return new EntityObjectResponse(entity.getId(), entity.getName(), entity.getCreatedAt());
    }
}