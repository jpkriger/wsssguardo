package wsssguardo.company.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;

@Component
public class CompanyMapper {

    public Company toEntity(CompanyRequestDTO dto) {
        return Company.builder()
                .name(dto.name())
                .build();
    }

    public CompanyResponseDTO toResponseDTO(Company company) {
        return new CompanyResponseDTO(
            company.getId(),
            company.getName(),
            company.getCreatedAt()
        );
    }
}