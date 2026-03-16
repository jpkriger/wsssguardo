package wsssguardo.entityobject.service;

import java.util.List;

import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;

public interface EntityObjectService {

    EntityObjectResponse create(EntityObjectCreateRequest request);

    EntityObjectResponse getById(Long id);

    List<EntityObjectResponse> listAll();
}
