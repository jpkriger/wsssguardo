package wsssguardo.company.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.company.Company;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    
}
