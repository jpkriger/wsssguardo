package wsssguardo.company.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;

class CompanyMapperTest {

    private final CompanyMapper mapper = new CompanyMapper();

    @Test
    void toEntityShouldMapName() {
        CompanyRequestDTO dto = new CompanyRequestDTO("Acme");

        Company entity = mapper.toEntity(dto);

        assertEquals("Acme", entity.getName());
    }

    @Test
    void toResponseDTOShouldMapAllFields() {
        Company company = new Company();
        company.setId(UUID.randomUUID());
        company.setName("Acme");

        CompanyResponseDTO response = mapper.toResponseDTO(company);

        assertEquals(company.getId(), response.id());
        assertEquals("Acme", response.name());
    }
}
