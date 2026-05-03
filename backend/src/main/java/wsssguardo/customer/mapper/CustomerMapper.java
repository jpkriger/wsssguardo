package wsssguardo.customer.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.requestdto.CustomerRequestDTO;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequestDTO dto) {
        return Customer.builder()
                .name(dto.name())
                .build();
    }

    public CustomerResponseDTO toResponseDTO(Customer customer) {
        return new CustomerResponseDTO(
            customer.getId(),
            customer.getName()
        );
    }
}