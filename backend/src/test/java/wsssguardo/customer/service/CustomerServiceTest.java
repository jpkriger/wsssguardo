package wsssguardo.customer.service;

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

import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.requestdto.CustomerRequestDTO;
import wsssguardo.customer.dto.requestdto.CustomerUpdateRequestDTO;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;
import wsssguardo.customer.mapper.CustomerMapper;
import wsssguardo.customer.mapper.CustomerUpdateMapper;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository repository;

    @Mock
    private CustomerMapper mapper;

    @Mock
    private CustomerUpdateMapper updateMapper;

    @InjectMocks
    private CustomerService service;

    @Test
    void createShouldReturnMappedResponse() {
        CustomerRequestDTO dto = new CustomerRequestDTO("Test Customer");
        Customer entity = new Customer();
        entity.setId(UUID.randomUUID());
        entity.setName("Test Customer");
        CustomerResponseDTO expected = new CustomerResponseDTO(entity.getId(), "Test Customer", java.time.LocalDateTime.now());

        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toResponseDTO(entity)).thenReturn(expected);

        CustomerResponseDTO actual = service.create(dto);

        assertEquals(expected, actual);
        verify(mapper).toEntity(dto);
        verify(repository).save(entity);
        verify(mapper).toResponseDTO(entity);
    }

    @Test
    void updateFoundShouldReturnMappedResponse() {
        UUID id = UUID.randomUUID();
        CustomerUpdateRequestDTO dto = new CustomerUpdateRequestDTO("Updated Name");
        Customer entity = new Customer();
        entity.setId(id);
        entity.setName("Original Name");
        CustomerResponseDTO expected = new CustomerResponseDTO(id, "Updated Name", java.time.LocalDateTime.now());

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(mapper.toResponseDTO(entity)).thenReturn(expected);

        CustomerResponseDTO actual = service.update(id, dto);

        assertEquals(expected, actual);
        verify(repository).findById(id);
        verify(updateMapper).update(entity, dto);
        verify(mapper).toResponseDTO(entity);
    }

    @Test
    void updateNotFoundShouldThrowException() {
        UUID id = UUID.randomUUID();
        CustomerUpdateRequestDTO dto = new CustomerUpdateRequestDTO("Updated Name");

        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(id, dto));
        verify(repository).findById(id);
        verifyNoInteractions(updateMapper, mapper);
    }

    @Test
    void deleteFoundShouldDeleteEntity() {
        UUID id = UUID.randomUUID();
        Customer entity = new Customer();
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
