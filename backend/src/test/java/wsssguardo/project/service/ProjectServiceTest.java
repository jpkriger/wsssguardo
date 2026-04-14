package wsssguardo.project.service;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.project.dto.responsedto.ProjectDocumentResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ProjectServiceTest {

    @Test
    void documentsByProjectIdReturnsMockedDocuments() {
        ProjectService service = new ProjectService(null);

        List<ProjectDocumentResponseDTO> documents = service.documentsByProjectId(UUID.fromString("d1f68b5c-4c5d-4a6f-9a3d-80e4ff5da2e1"));

        assertFalse(documents.isEmpty(), "Expected mocked documents to be returned");
        assertEquals(3, documents.size());
        assertEquals("Projeto Kickoff", documents.get(0).name());
        assertEquals("/documents/project-kickoff.pdf", documents.get(0).url());
    }
}
