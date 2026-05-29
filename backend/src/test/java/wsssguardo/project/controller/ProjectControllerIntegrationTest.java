package wsssguardo.project.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import wsssguardo.project.dto.ProjectCreateRequest;
import wsssguardo.project.dto.ProjectUpdateRequest;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigUpdateDTO;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.repository.UserRepository;

class ProjectControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    @Test
    void createProjectShouldPersistNewProjectWithRiskConfig() throws Exception {
        Company company = createCompany("Tech Corp");

        ProjectCreateRequest request = new ProjectCreateRequest(
                "New Security Audit",
                company.getId(),
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 6, 1),
                null,
                createDefaultRiskConfig());

        mockMvc.perform(post("/api/projects")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name", is("New Security Audit")))
                .andExpect(jsonPath("$.companyId", is(company.getId().toString())))
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));
    }

    @Test
    void createProjectShouldFailWhenRiskConfigIsNull() throws Exception {
        Company company = createCompany("Tech Corp");

        String requestJson = """
                {
                  "name": "Invalid Project",
                  "companyId": "%s",
                  "startDate": "2026-04-01",
                  "endDate": "2026-06-01"
                }
                """.formatted(company.getId());

        mockMvc.perform(post("/api/projects")
                .contentType(APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProjectShouldFailWhenRiskRangeIsInvalid() throws Exception {
        Company company = createCompany("Tech Corp");

        RiskConfigUpdateDTO invalidConfig = RiskConfigUpdateDTO.builder()
                .minRange(100)
                .maxRange(50) // Invalid: max < min
                .categories(List.of(
                        RiskCategoryDTO.builder().label("High").minRange(100).maxRange(50).build()))
                .build();

        ProjectCreateRequest request = new ProjectCreateRequest(
                "Invalid Project",
                company.getId(),
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 6, 1),
                null,
                invalidConfig);

        mockMvc.perform(post("/api/projects")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProjectShouldFailWhenCategoryRangeIsOutsideProjectRange() throws Exception {
        Company company = createCompany("Tech Corp");

        RiskConfigUpdateDTO invalidConfig = RiskConfigUpdateDTO.builder()
                .minRange(1)
                .maxRange(10)
                .categories(List.of(
                        RiskCategoryDTO.builder().label("High").minRange(0).maxRange(15).build() // Outside range
                ))
                .build();

        ProjectCreateRequest request = new ProjectCreateRequest(
                "Invalid Project",
                company.getId(),
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 6, 1),
                null,
                invalidConfig);

        mockMvc.perform(post("/api/projects")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProjectShouldNotAllowChangingCompanyId() throws Exception {
        Company originalCompany = createCompany("Original Corp");
        Project project = createProject("Test Project", originalCompany, ProjectStatus.IN_PROGRESS);

        ProjectUpdateRequest request = new ProjectUpdateRequest(
                "Updated Name",
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 7, 1),
                null,
                ProjectStatus.ON_HOLD);

        mockMvc.perform(patch("/api/projects/" + project.getId())
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.companyId", is(originalCompany.getId().toString())))
                .andExpect(jsonPath("$.status", is("ON_HOLD")));
    }

    @Test
    void updateProjectShouldAllowChangingNameAndStatus() throws Exception {
        Company company = createCompany("Tech Corp");
        Project project = createProject("Original Name", company, ProjectStatus.IN_PROGRESS);

        ProjectUpdateRequest request = new ProjectUpdateRequest(
                "Updated Name",
                null,
                null,
                null,
                ProjectStatus.COMPLETED);

        mockMvc.perform(patch("/api/projects/" + project.getId())
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.status", is("COMPLETED")));
    }

    @Test
    void deleteProjectShouldRemoveProjectAndRelatedData() throws Exception {
        Company company = createCompany("Tech Corp");
        Project project = createProject("Project To Delete", company, ProjectStatus.IN_PROGRESS);

        UUID projectId = project.getId();

        // Verify project exists
        mockMvc.perform(get("/api/projects")
                .queryParam("ids", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // Delete project
        mockMvc.perform(delete("/api/projects/" + projectId))
                .andExpect(status().isNoContent());

        // Verify project is deleted
        mockMvc.perform(get("/api/projects")
                .queryParam("ids", projectId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    private RiskConfigUpdateDTO createDefaultRiskConfig() {
        return RiskConfigUpdateDTO.builder()
                .minRange(0)
                .maxRange(100)
                .categories(List.of(
                        RiskCategoryDTO.builder().label("Baixo").minRange(0).maxRange(32).build(),
                        RiskCategoryDTO.builder().label("Médio").minRange(33).maxRange(65).build(),
                        RiskCategoryDTO.builder().label("Alto").minRange(66).maxRange(100).build()))
                .build();
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
