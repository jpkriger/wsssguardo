package wsssguardo.project.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.company.Company;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.user.User;

class ProjectMapperTest {

    private final ProjectMapper mapper = new ProjectMapper();

    @Test
    void toResponseShouldReturnEmptyConsultantsWhenNull() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Proj");
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setProjectUsers(null);

        ProjectResponse response = mapper.toResponse(project);

        assertTrue(response.consultantIds().isEmpty());
        assertNull(response.companyId());
    }

    @Test
    void toResponseShouldFilterOutSoftDeletedConsultants() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Proj");
        project.setStatus(ProjectStatus.IN_PROGRESS);

        User activeUser = new User();
        activeUser.setId(UUID.randomUUID());
        User deletedUser = new User();
        deletedUser.setId(UUID.randomUUID());

        ProjectUser activePu = ProjectUser.builder().user(activeUser).project(project).build();
        ProjectUser deletedPu = ProjectUser.builder().user(deletedUser).project(project).build();
        deletedPu.setDeletedAt(LocalDateTime.now());

        project.setProjectUsers(new ArrayList<>(List.of(activePu, deletedPu)));

        ProjectResponse response = mapper.toResponse(project);

        assertEquals(1, response.consultantIds().size());
        assertEquals(activeUser.getId(), response.consultantIds().get(0));
    }

    @Test
    void toResponseShouldMapCompanyIdAndAiReportIntro() {
        Company company = new Company();
        company.setId(UUID.randomUUID());
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Proj");
        project.setCompany(company);
        project.setStatus(ProjectStatus.COMPLETED);
        project.setAiReportIntro("intro gerado");

        ProjectResponse response = mapper.toResponse(project);

        assertEquals(company.getId(), response.companyId());
        assertEquals("intro gerado", response.aiReportIntro());
    }
}
