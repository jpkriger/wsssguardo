package wsssguardo.entityobject.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.EntityObjectResponse;
import wsssguardo.entityobject.mapper.EntityObjectMapper;
import wsssguardo.entityobject.repository.EntityObjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class EntityObjectServiceImplTest {

    @Mock
    private EntityObjectRepository repository;

    private EntityObjectMapper mapper;
    private EntityObjectServiceImpl service;

    @BeforeEach
    void setUp() {
        mapper = new EntityObjectMapper();
        service = new EntityObjectServiceImpl(repository, mapper);
    }

    @Test
    void createShouldPersistAndReturnResponse() {
        EntityObjectCreateRequest request = new EntityObjectCreateRequest("Example");
        EntityObject saved = new EntityObject();
        saved.setId(1L);
        saved.setName("Example");
        saved.setCreatedAt(Instant.now());

        when(repository.save(org.mockito.ArgumentMatchers.any(EntityObject.class))).thenReturn(saved);

        EntityObjectResponse response = service.create(request);

        assertEquals(1L, response.id());
        assertEquals("Example", response.name());
        assertNotNull(response.createdAt());
        verify(repository).save(org.mockito.ArgumentMatchers.any(EntityObject.class));
    }

    @Test
    void getByIdShouldReturnEntityWhenFound() {
        EntityObject entityObject = new EntityObject();
        entityObject.setId(10L);
        entityObject.setName("Found");
        entityObject.setCreatedAt(Instant.now());

        when(repository.findById(10L)).thenReturn(Optional.of(entityObject));

        EntityObjectResponse response = service.getById(10L);

        assertEquals(10L, response.id());
        assertEquals("Found", response.name());
    }

    @Test
    void getByIdShouldThrowWhenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(99L));
    }

    @Test
    void listAllShouldMapAllEntities() {
        EntityObject first = new EntityObject();
        first.setId(1L);
        first.setName("A");
        first.setCreatedAt(Instant.now());

        EntityObject second = new EntityObject();
        second.setId(2L);
        second.setName("B");
        second.setCreatedAt(Instant.now());

        when(repository.findAll()).thenReturn(List.of(first, second));

        List<EntityObjectResponse> responses = service.listAll();

        assertEquals(2, responses.size());
        assertEquals("A", responses.get(0).name());
        assertEquals("B", responses.get(1).name());
    }
}
