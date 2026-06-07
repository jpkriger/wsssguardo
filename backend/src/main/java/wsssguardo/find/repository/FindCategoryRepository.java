package wsssguardo.find.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.find.domain.FindCategory;

public interface FindCategoryRepository extends JpaRepository<FindCategory, UUID> {
}
