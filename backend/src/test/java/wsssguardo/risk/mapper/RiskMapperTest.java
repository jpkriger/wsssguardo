package wsssguardo.risk.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.risk.Risk;
import wsssguardo.risk.RiskPriority;
import wsssguardo.risk.dto.requestdto.RiskCreateRequestDTO;
import wsssguardo.risk.dto.requestdto.RiskUpdateRequestDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskResponseDTO;

class RiskMapperTest {

    private final RiskMapper mapper = new RiskMapper();

    private Find find(UUID id) {
        Find f = new Find();
        f.setId(id);
        return f;
    }

    @Test
    void toEntityShouldMapAllFieldsAndTrimName() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Find find = find(UUID.randomUUID());
        RiskCreateRequestDTO request = new RiskCreateRequestDTO(
                " Risk Name ", List.of(find.getId()), "desc", "cons",
                0.5f, 0.7f, 8f, 7f, 6f, 5f, "rec", RiskPriority.P1);

        Risk risk = mapper.toEntity(request, project, List.of(find));

        assertEquals("Risk Name", risk.getName());
        assertEquals(project, risk.getProject());
        assertEquals(List.of(find), risk.getFinds());
        assertEquals("desc", risk.getDescription());
        assertEquals(RiskPriority.P1, risk.getPriority());
    }

    @Test
    void toResponseShouldMapFindIdsAndNullProject() {
        Risk risk = new Risk();
        risk.setId(UUID.randomUUID());
        risk.setName("Risk");
        risk.setFinds(new ArrayList<>());
        risk.setPriority(RiskPriority.P2);

        RiskResponseDTO response = mapper.toResponse(risk);

        assertNull(response.projectId());
        assertTrue(response.findIds().isEmpty());
    }

    @Test
    void toResponseShouldMapProjectIdAndFindIdsWhenPresent() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Find find = find(UUID.randomUUID());
        Risk risk = new Risk();
        risk.setId(UUID.randomUUID());
        risk.setName("Risk");
        risk.setProject(project);
        risk.setFinds(List.of(find));
        risk.setPriority(RiskPriority.P3);

        RiskResponseDTO response = mapper.toResponse(risk);

        assertEquals(project.getId(), response.projectId());
        assertEquals(List.of(find.getId()), response.findIds());
    }

    @Test
    void toPageDTOShouldMapPageMetadata() {
        Risk risk = new Risk();
        risk.setId(UUID.randomUUID());
        risk.setName("Risk");
        risk.setFinds(new ArrayList<>());
        risk.setPriority(RiskPriority.P1);
        Page<Risk> page = new PageImpl<>(List.of(risk), PageRequest.of(0, 10), 1);

        RiskPageResponseDTO result = mapper.toPageDTO(page);

        assertEquals(1, result.content().size());
        assertEquals(0, result.page());
        assertEquals(10, result.size());
        assertEquals(1, result.totalElements());
        assertEquals(1, result.totalPages());
        assertTrue(result.first());
        assertTrue(result.last());
    }

    @Test
    void updateEntityShouldApplyAllProvidedFields() {
        Risk risk = new Risk();
        risk.setName("Old");
        risk.setFinds(new ArrayList<>());
        Find newFind = find(UUID.randomUUID());

        RiskUpdateRequestDTO request = new RiskUpdateRequestDTO(
                "New Name", "New Desc", "New Cons", 0.1f, 0.2f, 1f,
                List.of(newFind.getId()), 2f, 3f, 4f, "New Rec", RiskPriority.P4);

        mapper.updateEntity(risk, request, List.of(newFind));

        assertEquals("New Name", risk.getName());
        assertEquals("New Desc", risk.getDescription());
        assertEquals("New Cons", risk.getConsequences());
        assertEquals(0.1f, risk.getOccurrenceProbability());
        assertEquals(0.2f, risk.getImpactProbability());
        assertEquals(1f, risk.getDamageOperations());
        assertEquals(List.of(newFind), risk.getFinds());
        assertEquals(2f, risk.getDamageIndividuals());
        assertEquals(3f, risk.getDamageOtherOrgs());
        assertEquals(4f, risk.getDamageAssets());
        assertEquals("New Rec", risk.getRecommendation());
        assertEquals(RiskPriority.P4, risk.getPriority());
    }

    @Test
    void updateEntityShouldKeepExistingValuesWhenAllFieldsNull() {
        Risk risk = new Risk();
        risk.setName("Old");
        risk.setDescription("OldDesc");
        risk.setFinds(new ArrayList<>(List.of(find(UUID.randomUUID()))));
        risk.setPriority(RiskPriority.P1);

        RiskUpdateRequestDTO request = new RiskUpdateRequestDTO(
                null, null, null, null, null, null, null, null, null, null, null, null);

        mapper.updateEntity(risk, request, null);

        assertEquals("Old", risk.getName());
        assertEquals("OldDesc", risk.getDescription());
        assertEquals(1, risk.getFinds().size());
        assertEquals(RiskPriority.P1, risk.getPriority());
    }

    @Test
    void applyFindsShouldReplaceExistingCollectionContents() {
        Risk risk = new Risk();
        Find oldFind = find(UUID.randomUUID());
        Find newFind = find(UUID.randomUUID());
        risk.setFinds(new ArrayList<>(List.of(oldFind)));

        boolean changed = mapper.applyFinds(risk, List.of(newFind));

        assertTrue(changed);
        assertEquals(List.of(newFind), risk.getFinds());
    }

    @Test
    void applyMethodsShouldReturnFalseWhenValueIsNull() {
        Risk risk = new Risk();
        risk.setName("Keep");

        assertEquals(false, mapper.applyName(risk, null));
        assertEquals("Keep", risk.getName());
    }
}
