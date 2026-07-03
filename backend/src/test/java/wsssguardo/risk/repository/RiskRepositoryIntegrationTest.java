package wsssguardo.risk.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import wsssguardo.AbstractIntegrationTest;
import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.find.Find;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.RiskPriority;

class RiskRepositoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private RiskRepository riskRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FindRepository findRepository;

    @Test
    void findByIdAndProjectIdShouldReturnAllFindsForRiskWithMultipleFinds() {
        Project project = createProject();
        Find find1 = createFind(project, "Public endpoint");
        Find find2 = createFind(project, "Weak credentials");
        Find find3 = createFind(project, "Outdated dependency");

        Risk risk = new Risk();
        risk.setName("Risk with multiple finds");
        risk.setProject(project);
        risk.setFinds(new java.util.ArrayList<>(List.of(find1, find2, find3)));
        risk.setDamageOperations(5f);
        risk.setDamageIndividuals(5f);
        risk.setDamageOtherOrgs(5f);
        risk.setDamageAssets(5f);
        risk.setGeneralRisk(5f);
        risk.setPriority(RiskPriority.P2);
        risk.setCreatedAt(LocalDateTime.now());
        Risk saved = riskRepository.saveAndFlush(risk);

        Optional<Risk> result = assertDoesNotThrow(
                () -> riskRepository.findByIdAndProjectId(saved.getId(), project.getId()),
                "findByIdAndProjectId não deveria lançar NonUniqueResultException para risco com múltiplos finds");

        assertTrue(result.isPresent());
        assertEquals(3, result.get().getFinds().size(),
                "todos os finds do risco devem ser carregados, não só um por causa do JOIN");
    }

    @Test
    void findByIdAndProjectIdShouldReturnEmptyWhenNotFound() {
        Project project = createProject();
        Optional<Risk> result = riskRepository.findByIdAndProjectId(UUID.randomUUID(), project.getId());
        assertTrue(result.isEmpty());
    }

    private Project createProject() {
        Company company = new Company();
        company.setName("Acme Corp");
        company.setCreatedAt(LocalDateTime.now());
        Company savedCompany = companyRepository.saveAndFlush(company);

        Project project = new Project();
        project.setName("Test Project");
        project.setCompany(savedCompany);
        project.setStartDate(LocalDate.of(2026, 3, 1));
        project.setEndDate(LocalDate.of(2026, 12, 1));
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setCreatedAt(LocalDateTime.now());
        return projectRepository.saveAndFlush(project);
    }

    private Find createFind(Project project, String name) {
        Find find = new Find();
        find.setName(name);
        find.setProject(project);
        find.setCreatedAt(LocalDateTime.now());
        return findRepository.saveAndFlush(find);
    }
}
