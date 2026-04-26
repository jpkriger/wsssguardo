package wsssguardo.find.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.find.Find;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;

@Component
public class FindMapper {

    public FindNameResponseDTO toNameResponse(Find find) {
        return new FindNameResponseDTO(find.getId(), find.getName());
    }
}
