package wsssguardo.company.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;
import wsssguardo.company.mapper.CompanyMapper;
import wsssguardo.company.mapper.CompanyUpdateMapper;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository repository;

    @Mock
    private CompanyMapper mapper;

    @Mock
    private CompanyUpdateMapper updateMapper;

    @InjectMocks
    private CompanyService service;

    @Test
    void createShouldReturnMappedResponse() {
        CompanyRequestDTO dto = new CompanyRequestDTO("Test Company");
        Company entity = new Company();
        entity.setId(UUID.randomUUID());
        entity.setName("Test Company");
        CompanyResponseDTO expected = new CompanyResponseDTO(entity.getId(), "Test Company", java.time.LocalDateTime.now());

        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponseDTO(entity)).thenReturn(expected);

        CompanyResponseDTO actual = service.create(dto);

        assertEquals(expected, actual);
        verify(mapper).toEntity(dto);
        verify(repository).save(entity);
        verify(mapper).toResponseDTO(entity);
    }

    @Test
    void updateFoundShouldReturnMappedResponse() {
        UUID id = UUID.randomUUID();
        CompanyUpdateRequestDTO dto = new CompanyUpdateRequestDTO("Updated Name");
        Company entity = new Company();
        entity.setId(id);
        entity.setName("Original Name");
        CompanyResponseDTO expected = new CompanyResponseDTO(id, "Updated Name", java.time.LocalDateTime.now());

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(mapper.toResponseDTO(entity)).thenReturn(expected);

        CompanyResponseDTO actual = service.update(id, dto);

        assertEquals(expected, actual);
        verify(repository).findById(id);
        verify(updateMapper).update(entity, dto);
        verify(mapper).toResponseDTO(entity);
    }

    @Test
    void updateNotFoundShouldThrowException() {
        UUID id = UUID.randomUUID();
        CompanyUpdateRequestDTO dto = new CompanyUpdateRequestDTO("Updated Name");

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(id, dto));
        verify(repository).findById(id);
        verifyNoInteractions(updateMapper, mapper);
    }

    @Test
    void deleteFoundShouldDeleteEntity() {
        UUID id = UUID.randomUUID();
        Company entity = new Company();
        entity.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(entity));

        service.delete(id);

        verify(repository).findById(id);
        verify(repository).delete(entity);
    }

    @Test
    void deleteNotFoundShouldThrowException() {
        UUID id = UUID.randomUUID();

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(id));
        verify(repository).findById(id);
        verifyNoInteractions(mapper);
    }
}
