package wsssguardo.find.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.find.Find;

public interface FindRepository extends JpaRepository<Find, UUID> {
  
}
