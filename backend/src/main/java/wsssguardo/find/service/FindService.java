package wsssguardo.find.service;

import java.util.List;
import java.util.UUID;

import wsssguardo.find.dto.responsedto.FindNameResponseDTO;

public interface FindService {

    List<FindNameResponseDTO> getFindingNameByProjectId(UUID projectId);
}
