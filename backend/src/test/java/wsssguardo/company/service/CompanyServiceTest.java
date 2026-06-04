package wsssguardo.company.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;
import wsssguardo.company.mapper.CompanyMapper;
import wsssguardo.company.mapper.CompanyUpdateMapper;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.project.Project;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository repository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMapper projectMapper;

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
        when(projectRepository.findByCompanyId(id)).thenReturn(Collections.emptyList());

        service.delete(id);

        verify(repository).findById(id);
        verify(projectRepository).findByCompanyId(id);
        verify(repository).delete(entity);
    }

    @Test
    void deleteFoundWithProjectsShouldThrowException() {
        UUID id = UUID.randomUUID();
        Company entity = new Company();
        entity.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(projectRepository.findByCompanyId(id)).thenReturn(List.of(new Project()));

        assertThrows(ApiException.class, () -> service.delete(id));

        verify(repository).findById(id);
        verify(projectRepository).findByCompanyId(id);
        verify(repository, org.mockito.Mockito.never()).delete(any());
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
