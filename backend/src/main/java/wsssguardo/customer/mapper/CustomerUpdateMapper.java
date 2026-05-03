package wsssguardo.customer.mapper;

import org.springframework.stereotype.Component;

import wsssguardo.customer.Customer;
import wsssguardo.customer.dto.requestdto.CustomerUpdateRequestDTO;

@Component
public class CustomerUpdateMapper {
    public void update(Customer customer, CustomerUpdateRequestDTO dto) {
        if(dto.name() != null) {
            customer.setName(dto.name());
        }
    }
}
