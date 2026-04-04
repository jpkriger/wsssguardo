package wsssguardo.entityobject.service;

import java.util.List;
import java.util.UUID;

import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;

public interface EntityObjectService {

    EntityObjectResponseDTO create(EntityObjectRequestDTO request);

    EntityObjectResponseDTO getById(UUID id);

    List<EntityObjectResponseDTO> listAll();
}
