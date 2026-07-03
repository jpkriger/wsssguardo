package wsssguardo.company.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;

class CompanyUpdateMapperTest {

    private final CompanyUpdateMapper mapper = new CompanyUpdateMapper();

    @Test
    void updateShouldSetNameWhenProvided() {
        Company company = new Company();
        company.setName("Old");

        mapper.update(company, new CompanyUpdateRequestDTO("New"));

        assertEquals("New", company.getName());
    }

    @Test
    void updateShouldKeepNameWhenNull() {
        Company company = new Company();
        company.setName("Old");

        mapper.update(company, new CompanyUpdateRequestDTO(null));

        assertEquals("Old", company.getName());
    }
}
