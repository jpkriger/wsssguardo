package wsssguardo.entityobject.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import wsssguardo.entityobject.EntityObject;
import wsssguardo.entityobject.dto.requestdto.EntityObjectRequestDTO;
import wsssguardo.entityobject.dto.requestdto.EntityObjectUpdateRequestDTO;
import wsssguardo.entityobject.dto.responsedto.EntityObjectResponseDTO;

class EntityObjectMapperTest {

    private final EntityObjectMapper mapper = new EntityObjectMapper();

    @Test
    void toEntityShouldMapFields() {
        EntityObjectRequestDTO request = new EntityObjectRequestDTO("Nome", "Desc", "Ref");

        EntityObject entity = mapper.toEntity(request);

        assertEquals("Nome", entity.getName());
        assertEquals("Desc", entity.getDescription());
        assertEquals("Ref", entity.getReference());
    }

    @Test
    void applyUpdateShouldSetProvidedFields() {
        EntityObject entity = new EntityObject();
        entity.setName("Old");
        entity.setDescription("OldDesc");
        entity.setReference("OldRef");

        mapper.applyUpdate(new EntityObjectUpdateRequestDTO("New", "NewDesc", "NewRef"), entity);

        assertEquals("New", entity.getName());
        assertEquals("NewDesc", entity.getDescription());
        assertEquals("NewRef", entity.getReference());
    }

    @Test
    void applyUpdateShouldKeepFieldsWhenNull() {
        EntityObject entity = new EntityObject();
        entity.setName("Old");
        entity.setDescription("OldDesc");
        entity.setReference("OldRef");

        mapper.applyUpdate(new EntityObjectUpdateRequestDTO(null, null, null), entity);

        assertEquals("Old", entity.getName());
        assertEquals("OldDesc", entity.getDescription());
        assertEquals("OldRef", entity.getReference());
    }

    @Test
    void toResponseShouldMapAllFields() {
        EntityObject entity = new EntityObject();
        entity.setName("Nome");
        entity.setDescription("Desc");
        entity.setReference("Ref");

        EntityObjectResponseDTO response = mapper.toResponse(entity);

        assertEquals("Nome", response.name());
        assertEquals("Desc", response.description());
        assertEquals("Ref", response.reference());
    }
}
