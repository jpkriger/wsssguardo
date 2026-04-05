package wsssguardo.project.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import wsssguardo.customer.Customer;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.repository.ProjectRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = "security.auth.disabled=true")
@Transactional
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    void projectsByIdShouldReturnPersistedItemsInRequestedOrder() throws Exception {
        Customer customer = createCustomer("Acme Corp");
        Project first = createProject("Alpha Platform", customer, ProjectStatus.COMPLETED);
        Project second = createProject("Mobile App", customer, ProjectStatus.IN_PROGRESS);

        mockMvc.perform(get("/api/projectsById")
                .queryParam("ids", second.getId().toString())
                .queryParam("ids", first.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id", is(second.getId().toString())))
            .andExpect(jsonPath("$[0].name", is("Mobile App")))
            .andExpect(jsonPath("$[0].customerId", is(customer.getId().toString())))
            .andExpect(jsonPath("$[0].status", is("IN_PROGRESS")))
            .andExpect(jsonPath("$[1].id", is(first.getId().toString())))
            .andExpect(jsonPath("$[1].name", is("Alpha Platform")))
            .andExpect(jsonPath("$[1].status", is("COMPLETED")));
    }

    @Test
    void projectsByIdShouldReturnEmptyListWhenIdsAreMissing() throws Exception {
        mockMvc.perform(get("/api/projectsById"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void projectsByIdShouldIgnoreUnknownIds() throws Exception {
        Customer customer = createCustomer("Stark Industries");
        Project project = createProject("Internal Tools", customer, ProjectStatus.ON_HOLD);
        UUID unknownId = UUID.randomUUID();

        mockMvc.perform(get("/api/projectsById")
                .queryParam("ids", unknownId.toString())
                .queryParam("ids", project.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id", is(project.getId().toString())))
            .andExpect(jsonPath("$[0].name", is("Internal Tools")));
    }

    private Customer createCustomer(String name) {
        Customer customer = new Customer();
        customer.setName(name);
        customer.setCreatedAt(LocalDateTime.now());
        return customerRepository.saveAndFlush(customer);
    }

    private Project createProject(String name, Customer customer, ProjectStatus status) {
        Project project = new Project();
        project.setName(name);
        project.setCustomer(customer);
        project.setStartDate(LocalDate.of(2026, 3, 1));
        project.setEndDate(LocalDate.of(2026, 12, 1));
        project.setStatus(status);
        project.setCreatedAt(LocalDateTime.now());
        return projectRepository.saveAndFlush(project);
    }
}