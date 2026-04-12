package wsssguardo.project.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.EntityManager;
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
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.domain.UserProjectLevel;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = "security.auth.disabled=true")
@Transactional
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void projectsByIdShouldReturnPersistedItemsInRequestedOrder() throws Exception {
        Customer customer = createCustomer("Acme Corp");
        Project first = createProject("Alpha Platform", customer, ProjectStatus.COMPLETED);
        Project second = createProject("Mobile App", customer, ProjectStatus.IN_PROGRESS);

        mockMvc.perform(get("/api/projects")
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
        mockMvc.perform(get("/api/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void projectsByIdShouldIgnoreUnknownIds() throws Exception {
        Customer customer = createCustomer("Stark Industries");
        Project project = createProject("Internal Tools", customer, ProjectStatus.ON_HOLD);
        UUID unknownId = UUID.randomUUID();

        mockMvc.perform(get("/api/projects")
                .queryParam("ids", unknownId.toString())
                .queryParam("ids", project.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id", is(project.getId().toString())))
            .andExpect(jsonPath("$[0].name", is("Internal Tools")));
    }

    @Test
    void projectsByUserIdShouldReturnRelatedProjectIds() throws Exception {
        User user = createUser("consultant-one");
        Customer customer = createCustomer("Acme Corp");

        Project older = createProject("Legacy", customer, LocalDateTime.of(2026, 3, 20, 8, 0));
        Project newer = createProject("Modern", customer, LocalDateTime.of(2026, 3, 21, 8, 0));

        linkUserToProject(user, older, UserProjectLevel.VIEWER);
        linkUserToProject(user, newer, UserProjectLevel.EDITOR);

        mockMvc.perform(get("/api/projects")
                .queryParam("userId", user.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0]", is(newer.getId().toString())))
            .andExpect(jsonPath("$[1]", is(older.getId().toString())));
    }

    @Test
    void projectsByUserIdShouldReturnEmptyListWhenUserHasNoProjects() throws Exception {
        User user = createUser("consultant-empty");

        mockMvc.perform(get("/api/projects")
                .queryParam("userId", user.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    private User createUser(String usernamePrefix) {
        User user = new User();
        user.setFullName("Consultant User");
        user.setUsername(usernamePrefix + "-" + UUID.randomUUID());
        user.setRole(UserRole.CONSULTANT);
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.saveAndFlush(user);
    }

    private Customer createCustomer(String name) {
        Customer customer = new Customer();
        customer.setName(name);
        customer.setCreatedAt(LocalDateTime.now());
        return customerRepository.saveAndFlush(customer);
    }

    private Project createProject(String name, Customer customer, LocalDateTime createdAt) {
        Project project = new Project();
        project.setName(name);
        project.setCustomer(customer);
        project.setStartDate(LocalDate.of(2026, 3, 1));
        project.setEndDate(LocalDate.of(2026, 12, 1));
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setCreatedAt(createdAt);
        return projectRepository.saveAndFlush(project);
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

    private void linkUserToProject(User user, Project project, UserProjectLevel level) {
        ProjectUser link = new ProjectUser();
        link.setUser(user);
        link.setProject(project);
        link.setAccessLevel(level);
        link.setCreatedAt(LocalDateTime.now());
        entityManager.persist(link);
        entityManager.flush();
    }
}
