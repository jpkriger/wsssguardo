package wsssguardo.risk.controller;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;

import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.repository.ProjectRepository;

import org.springframework.http.MediaType;

class RiskControllerIntegrationTest extends AbstractIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CompanyRepository companyRepository;

  @Autowired
  private ProjectRepository projectRepository;

  @Autowired
  private FindRepository findRepository;

  @Test
  void createRiskShouldReturnCreatedResponse() throws Exception {
    Company company = createCompany();
    Project project = createProject(company);
    Find find = createFind(project);

    String body = """
        {
          "projectId": "%s",
          "name": "Unauthorized data exposure",
          "findIds": ["%s"],
          "description": "Personal data exposed in public endpoint",
          "consequences": "Privacy incident",
          "occurrenceProbability": 0.7,
          "impactProbability": 0.9,
          "damageOperations": 8,
          "damageIndividuals": 9,
          "damageOtherOrgs": 7,
          "damageAssets": 6,
          "recommendation": "Restrict endpoint and add tests",
          "priority": "P1"
        }
        """.formatted(project.getId(), find.getId());

    mockMvc.perform(post("/api/projects/" + project.getId() + "/risks")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", notNullValue()))
        .andExpect(jsonPath("$.id", notNullValue()))
        .andExpect(jsonPath("$.projectId", is(project.getId().toString())))
        .andExpect(jsonPath("$.name", is("Unauthorized data exposure")))
        .andExpect(jsonPath("$.findIds[0]", is(find.getId().toString())))
        .andExpect(jsonPath("$.damageAssets", is(6.0)))
        .andExpect(jsonPath("$.generalRisk", is(7.5)))
        .andExpect(jsonPath("$.priority", is("P1")));
  }

  @Test
  void createRiskShouldReturnBadRequestWhenBodyIsInvalid() throws Exception {
    Company company = createCompany();
    Project project = createProject(company);
    mockMvc.perform(post("/api/projects/" + project.getId() + "/risks")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status", is(400)));
  }

  private Company createCompany() {
    Company company = new Company();
    company.setName("Acme Corp");
    company.setCreatedAt(LocalDateTime.now());
    return companyRepository.saveAndFlush(company);
  }

  private Project createProject(Company company) {
    Project project = new Project();
    project.setName("Privacy Review");
    project.setCompany(company);
    project.setStartDate(LocalDate.of(2026, 3, 1));
    project.setEndDate(LocalDate.of(2026, 12, 1));
    project.setStatus(ProjectStatus.IN_PROGRESS);
    project.setCreatedAt(LocalDateTime.now());
    return projectRepository.saveAndFlush(project);
  }

  private Find createFind(Project project) {
    Find find = new Find();
    find.setName("Public endpoint");
    find.setProject(project);
    find.setCreatedAt(LocalDateTime.now());
    return findRepository.saveAndFlush(find);
  }
}
