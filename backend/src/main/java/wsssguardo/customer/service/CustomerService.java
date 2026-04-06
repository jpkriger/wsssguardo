package wsssguardo.customer.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.customer.repository.CustomerRepository;

@Service
@RequiredArgsConstructor
public class CustomerService {
    
    private final CustomerRepository repository;

}
