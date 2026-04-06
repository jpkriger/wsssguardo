package wsssguardo.customer.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.customer.Customer;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    
}
