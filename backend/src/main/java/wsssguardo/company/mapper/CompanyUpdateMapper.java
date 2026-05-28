package wsssguardo.company.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;

@Component
public class CompanyUpdateMapper {
    public void update(Company company, CompanyUpdateRequestDTO dto) {
        if(dto.name() != null) {
            company.setName(dto.name());
        }
    }
}
