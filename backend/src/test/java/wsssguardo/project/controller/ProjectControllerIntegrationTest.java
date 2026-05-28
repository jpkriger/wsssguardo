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
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;
import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.repository.UserRepository;

class ProjectControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void projectsByIdShouldReturnPersistedItemsInRequestedOrder() throws Exception {
        Company company = createCompany("Acme Corp");
        Project first = createProject("Alpha Platform", company, ProjectStatus.COMPLETED);
        Project second = createProject("Mobile App", company, ProjectStatus.IN_PROGRESS);

        mockMvc.perform(get("/api/projects")
                .queryParam("ids", second.getId().toString())
                .queryParam("ids", first.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id", is(second.getId().toString())))
            .andExpect(jsonPath("$[0].name", is("Mobile App")))
            .andExpect(jsonPath("$[0].companyId", is(company.getId().toString())))
            .andExpect(jsonPath("$[0].status", is("IN_PROGRESS")))
            .andExpect(jsonPath("$[1].id", is(first.getId().toString())))
            .andExpect(jsonPath("$[1].name", is("Alpha Platform")))
            .andExpect(jsonPath("$[1].status", is("COMPLETED")));
    }

    @Test
    void listAllProjectsShouldReturnPersistedItemsWhenNoFiltersAreProvided() throws Exception {
        Company company = createCompany("Acme Corp");
        Project older = createProject("Legacy", company, LocalDateTime.of(2026, 3, 20, 8, 0));
        Project newer = createProject("Modern", company, LocalDateTime.of(2026, 3, 21, 8, 0));

        mockMvc.perform(get("/api/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id", is(newer.getId().toString())))
            .andExpect(jsonPath("$[1].id", is(older.getId().toString())));
    }

    @Test
    void projectsByIdShouldIgnoreUnknownIds() throws Exception {
        Company company = createCompany("Stark Industries");
        Project project = createProject("Internal Tools", company, ProjectStatus.ON_HOLD);
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
        Company company = createCompany("Acme Corp");

        Project older = createProject("Legacy", company, LocalDateTime.of(2026, 3, 20, 8, 0));
        Project newer = createProject("Modern", company, LocalDateTime.of(2026, 3, 21, 8, 0));

        linkUserToProject(user, older);
        linkUserToProject(user, newer);

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

    private Company createCompany(String name) {
        Company company = new Company();
        company.setName(name);
        company.setCreatedAt(LocalDateTime.now());
        return companyRepository.saveAndFlush(company);
    }

    private Project createProject(String name, Company company, LocalDateTime createdAt) {
        Project project = new Project();
        project.setName(name);
        project.setCompany(company);
        project.setStartDate(LocalDate.of(2026, 3, 1));
        project.setEndDate(LocalDate.of(2026, 12, 1));
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setCreatedAt(createdAt);
        return projectRepository.saveAndFlush(project);
    }

    private Project createProject(String name, Company company, ProjectStatus status) {
        Project project = new Project();
        project.setName(name);
        project.setCompany(company);
        project.setStartDate(LocalDate.of(2026, 3, 1));
        project.setEndDate(LocalDate.of(2026, 12, 1));
        project.setStatus(status);
        project.setCreatedAt(LocalDateTime.now());
        return projectRepository.saveAndFlush(project);
    }

    private void linkUserToProject(User user, Project project) {
        ProjectUser link = new ProjectUser();
        link.setUser(user);
        link.setProject(project);
        link.setCreatedAt(LocalDateTime.now());
        entityManager.persist(link);
        entityManager.flush();
    }
}
