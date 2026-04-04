package wsssguardo.entityobject.service;

import java.util.List;
import java.util.UUID;

import wsssguardo.entityobject.dto.requestdto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponse;

public interface EntityObjectService {

    EntityObjectResponse create(EntityObjectCreateRequest request);

    EntityObjectResponse getById(UUID id);

    List<EntityObjectResponse> listAll();
}