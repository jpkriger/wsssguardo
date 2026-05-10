package wsssguardo.entityobject.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;

class EntityObjectControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createThenListShouldReturnPersistedItem() throws Exception {
        mockMvc.perform(post("/api/entity-objects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Starter Item"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isString())
            .andExpect(jsonPath("$.name", is("Starter Item")))
            .andExpect(jsonPath("$.createdAt").isString());

        mockMvc.perform(get("/api/entity-objects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].name", is("Starter Item")));
    }

    @Test
    void createShouldReturnBadRequestWhenNameIsBlank() throws Exception {
        mockMvc.perform(post("/api/entity-objects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "   "
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status", is(400)))
            .andExpect(jsonPath("$.message").isString());
    }
}
