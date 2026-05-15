package wsssguardo.customer.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.requestdto.CustomerRequestDTO;
import wsssguardo.customer.dto.requestdto.CustomerUpdateRequestDTO;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;
import wsssguardo.customer.dto.responsedto.CustomerWithProjectsDTO;
import wsssguardo.customer.mapper.CustomerMapper;
import wsssguardo.customer.mapper.CustomerUpdateMapper;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;
    private final ProjectRepository projectRepository;
    private final CustomerMapper mapper;
    private final CustomerUpdateMapper updateMapper;
    private final ProjectMapper projectMapper;

    public List<CustomerResponseDTO> list() {
        return repository.findAll()
                .stream()
                .map(mapper::toResponseDTO)
                .toList();
    }

    public List<CustomerWithProjectsDTO> listWithProjects() {
        return repository.findAll()
                .stream()
                .map(customer -> {
                    var projects = projectRepository.findByCustomerId(customer.getId())
                            .stream()
                            .map(projectMapper::toResponse)
                            .toList();
                    return new CustomerWithProjectsDTO(
                            customer.getId(),
                            customer.getName(),
                            customer.getCreatedAt(),
                            projects
                    );
                })
                .toList();
    }

    @Transactional
    public CustomerResponseDTO create(CustomerRequestDTO dto) {
        Customer customer = mapper.toEntity(dto);
        repository.save(customer);
        return mapper.toResponseDTO(customer);
    }

    @Transactional
    public CustomerResponseDTO update(UUID id, CustomerUpdateRequestDTO dto) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        updateMapper.update(customer, dto);

        return mapper.toResponseDTO(customer);
    }

    @Transactional
    public void delete(UUID id) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        repository.delete(customer);
    }
}
