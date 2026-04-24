package wsssguardo.find.repository;

import java.util.UUID;

import org.hibernate.annotations.processing.Find;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FindRepository extends JpaRepository<Find, UUID> {
  
}
