package wsssguardo.find.controller;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;

import wsssguardo.customer.Customer;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.repository.ProjectRepository;

class FindControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FindRepository findRepository;

    @Test
    void getFindingNameByProjectIdShouldReturnFindingNamesForProject() throws Exception {
        Customer customer = createCustomer("Cliente Teste");
        Project project = createProject(customer);
        Find older = createFind(project, "Achado anterior", LocalDateTime.of(2026, 4, 20, 10, 0));
        Find newer = createFind(project, "Achado recente", LocalDateTime.of(2026, 4, 21, 10, 0));

        // Rota atualizada para nova arquitetura
        mockMvc.perform(get("/api/projects/{projectId}/findings/findingNameByProjectId", project.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id", is(newer.getId().toString())))
            .andExpect(jsonPath("$[0].name", is("Achado recente")))
            .andExpect(jsonPath("$[1].id", is(older.getId().toString())))
            .andExpect(jsonPath("$[1].name", is("Achado anterior")));
    }

    @Test
    void getFindingNameByProjectIdShouldReturnNotFoundWhenProjectDoesNotExist() throws Exception {
        UUID nonExistentProjectId = UUID.randomUUID();

        mockMvc.perform(get("/api/projects/{projectId}/findings/findingNameByProjectId", nonExistentProjectId))
            .andExpect(status().isNotFound());
    }

    private Customer createCustomer(String name) {
        Customer customer = new Customer();
        customer.setName(name);
        customer.setCreatedAt(LocalDateTime.now());
        return customerRepository.saveAndFlush(customer);
    }

    private Project createProject(Customer customer) {
        Project project = new Project();
        project.setName("Projeto Teste");
        project.setCustomer(customer);
        project.setStartDate(LocalDate.of(2026, 4, 1));
        project.setEndDate(LocalDate.of(2026, 12, 31));
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setCreatedAt(LocalDateTime.now());
        return projectRepository.saveAndFlush(project);
    }

    private Find createFind(Project project, String name, LocalDateTime createdAt) {
        Find find = Find.builder()
            .name(name)
            .project(project)
            .description("Descricao")
            .build();
        find.setCreatedAt(createdAt);
        return findRepository.saveAndFlush(find);
    }
}