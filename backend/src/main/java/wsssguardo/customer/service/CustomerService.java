package wsssguardo.customer.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.requestdto.CustomerRequestDTO;
import wsssguardo.customer.dto.requestdto.CustomerUpdateRequestDTO;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;
import wsssguardo.customer.mapper.CustomerMapper;
import wsssguardo.customer.mapper.CustomerUpdateMapper;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;
    private final CustomerMapper mapper;
    private final CustomerUpdateMapper updateMapper;

    public CustomerResponseDTO create(CustomerRequestDTO dto) {
        Customer customer = Customer.builder()
                .name(dto.name())
                .build();

        repository.save(customer);

        return mapper.toResponseDTO(customer);
    }

    public CustomerResponseDTO update(UUID id, CustomerUpdateRequestDTO dto) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        updateMapper.update(customer, dto);
        repository.save(customer);

        return mapper.toResponseDTO(customer);
    }

    public void delete(UUID id) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        repository.delete(customer);
    }
}
