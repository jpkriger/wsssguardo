package wsssguardo.customer.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;

@Component
public class CustomerMapper {
    public CustomerResponseDTO toResponseDTO(Customer customer) {
        return new CustomerResponseDTO(
            customer.getId(),
            customer.getName()
        );
    }
}