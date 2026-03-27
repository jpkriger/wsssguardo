package wsssguardo.entityobject.mapper;

import java.time.Instant;

import org.springframework.stereotype.Component;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;

@Component
public class EntityObjectMapper {

    public EntityObject toEntity(EntityObjectCreateRequest request) {
        EntityObject entityObject = new EntityObject();
        entityObject.setName(request.name());
        entityObject.setCreatedAt(Instant.now());
        return entityObject;
    }

    public EntityObjectResponse toResponse(EntityObject entityObject) {
        return new EntityObjectResponse(
            entityObject.getId(),
            entityObject.getName(),
            entityObject.getCreatedAt()
        );
    }
}
