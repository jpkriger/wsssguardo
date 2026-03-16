package wsssguardo.entityobject.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import wsssguardo.entityobject.EntityObject;

public interface EntityObjectRepository extends JpaRepository<EntityObject, Long> {
}
