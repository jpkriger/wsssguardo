package wsssguardo.entityobject.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.requestdto.EntityObjectCreateRequest;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponse;
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
        UUID id = UUID.randomUUID();
        EntityObjectCreateRequest request = new EntityObjectCreateRequest("Example");
        EntityObject saved = new EntityObject();
        saved.setId(id);
        saved.setName("Example");
        saved.setCreatedAt(Instant.now());

        when(repository.save(org.mockito.ArgumentMatchers.any(EntityObject.class))).thenReturn(saved);

        EntityObjectResponse response = service.create(request);

        assertEquals(id, response.id());
        assertEquals("Example", response.name());
        assertNotNull(response.createdAt());
        verify(repository).save(org.mockito.ArgumentMatchers.any(EntityObject.class));
    }

    @Test
    void getByIdShouldReturnEntityWhenFound() {
        UUID id = UUID.randomUUID();
        EntityObject entityObject = new EntityObject();
        entityObject.setId(id);
        entityObject.setName("Found");
        entityObject.setCreatedAt(Instant.now());

        when(repository.findById(id)).thenReturn(Optional.of(entityObject));

        EntityObjectResponse response = service.getById(id);

        assertEquals(id, response.id());
        assertEquals("Found", response.name());
    }

    @Test
    void getByIdShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(id));
    }

    @Test
    void listAllShouldMapAllEntities() {
        EntityObject first = new EntityObject();
        first.setId(UUID.randomUUID());
        first.setName("A");
        first.setCreatedAt(Instant.now());

        EntityObject second = new EntityObject();
        second.setId(UUID.randomUUID());
        second.setName("B");
        second.setCreatedAt(Instant.now());

        when(repository.findAll()).thenReturn(List.of(first, second));

        List<EntityObjectResponse> responses = service.listAll();

        assertEquals(2, responses.size());
        assertEquals("A", responses.get(0).name());
        assertEquals("B", responses.get(1).name());
    }
}