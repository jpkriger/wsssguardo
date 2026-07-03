package wsssguardo.artifact.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.artifact.dto.requestdto.ArtifactRequestDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.project.Project;

class ArtifactMapperTest {

    private final ArtifactMapper mapper = new ArtifactMapper();

    @Test
    void toEntityShouldMapAllFields() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        ArtifactRequestDTO request = new ArtifactRequestDTO(
                "Nome", "Desc", "Conteudo", "Categoria", "http://drive", ArtifactType.SHEET);

        Artifact entity = mapper.toEntity(request, project);

        assertEquals("Nome", entity.getName());
        assertEquals("Desc", entity.getDescription());
        assertEquals("Conteudo", entity.getContent());
        assertEquals("Categoria", entity.getCategory());
        assertEquals("http://drive", entity.getDriveLink());
        assertEquals(ArtifactType.SHEET, entity.getType());
        assertEquals(project, entity.getProject());
    }

    @Test
    void toResponseWithoutSummariesShouldDefaultToZero() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Artifact artifact = Artifact.builder()
                .name("Nome")
                .type(ArtifactType.LINK)
                .project(project)
                .build();
        artifact.setId(UUID.randomUUID());

        ArtifactResponseDTO response = mapper.toResponse(artifact);

        assertEquals(0, response.findingsSummary().high());
        assertEquals(0, response.risksSummary().low());
        assertEquals(project.getId(), response.projectId());
    }

    @Test
    void toResponseWithSummariesShouldMapAllFields() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Artifact artifact = Artifact.builder()
                .name("Nome")
                .description("Desc")
                .content("Content")
                .category("Cat")
                .driveLink("link")
                .llmSummary("summary")
                .type(ArtifactType.FILE)
                .project(project)
                .build();
        artifact.setId(UUID.randomUUID());

        ArtifactResponseDTO.FindingsSummary findings = new ArtifactResponseDTO.FindingsSummary(1, 2, 3);
        ArtifactResponseDTO.RisksSummary risks = new ArtifactResponseDTO.RisksSummary(4, 5, 6);

        ArtifactResponseDTO response = mapper.toResponse(artifact, findings, risks);

        assertEquals(artifact.getId(), response.id());
        assertEquals("Nome", response.name());
        assertEquals("summary", response.llmSummary());
        assertEquals(findings, response.findingsSummary());
        assertEquals(risks, response.risksSummary());
    }
}
