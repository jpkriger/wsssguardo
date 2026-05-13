package wsssguardo.risk.controller;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import wsssguardo.AbstractIntegrationTest;

import wsssguardo.asset.Asset;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.customer.Customer;
import wsssguardo.customer.repository.CustomerRepository;
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
  private CustomerRepository customerRepository;

  @Autowired
  private ProjectRepository projectRepository;

  @Autowired
  private FindRepository findRepository;

  @Autowired
  private AssetRepository assetRepository;

  @Test
  void createRiskShouldReturnCreatedResponse() throws Exception {
    Customer customer = createCustomer();
    Project project = createProject(customer);
    Find find = createFind(project);
    Asset asset = createAsset(project);

    String body = """
        {
          "projectId": "%s",
          "name": "Unauthorized data exposure",
          "findIds": ["%s"],
          "description": "Personal data exposed in public endpoint",
          "consequences": "Privacy incident",
          "occurrenceProbability": 0.7,
          "impactProbability": 0.9,
          "damageOperations": "Incident response required",
          "damageAssetIds": ["%s"],
          "damageIndividuals": "Personal data exposure",
          "damageOtherOrgs": "Partner notification",
          "recommendation": "Restrict endpoint and add tests",
          "riskLevel": 9000
        }
        """.formatted(project.getId(), find.getId(), asset.getId());

    mockMvc.perform(post("/api/risks")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", notNullValue()))
        .andExpect(jsonPath("$.id", notNullValue()))
        .andExpect(jsonPath("$.projectId", is(project.getId().toString())))
        .andExpect(jsonPath("$.name", is("Unauthorized data exposure")))
        .andExpect(jsonPath("$.findIds[0]", is(find.getId().toString())))
        .andExpect(jsonPath("$.damageAssetIds[0]", is(asset.getId().toString())))
        .andExpect(jsonPath("$.riskLevel", is(9000)));
  }

  @Test
  void createRiskShouldReturnBadRequestWhenBodyIsInvalid() throws Exception {
    mockMvc.perform(post("/api/risks")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status", is(400)));
  }

  private Customer createCustomer() {
    Customer customer = new Customer();
    customer.setName("Acme Corp");
    customer.setCreatedAt(LocalDateTime.now());
    return customerRepository.saveAndFlush(customer);
  }

  private Project createProject(Customer customer) {
    Project project = new Project();
    project.setName("Privacy Review");
    project.setCustomer(customer);
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

  private Asset createAsset(Project project) {
    Asset asset = new Asset();
    asset.setName("Customer API");
    asset.setProject(project);
    asset.setCreatedAt(LocalDateTime.now());
    return assetRepository.saveAndFlush(asset);
  }
}
