package wsssguardo.project.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.project.dto.responsedto.ProjectDocumentResponseDTO;
import wsssguardo.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class ProjectService {
    
    private final ProjectRepository repository;

    public List<ProjectDocumentResponseDTO> documentsByProjectId(UUID projectId) {
        return List.of(
            new ProjectDocumentResponseDTO("d1f68b5c-4c5d-4a6f-9a3d-80e4ff5da2e1", "Projeto Kickoff", "PDF", "/documents/project-kickoff.pdf"),
            new ProjectDocumentResponseDTO("a2e8c660-1f2b-4d3c-a0c4-64e7925d1a22", "Escopo do Projeto", "DOCX", "/documents/project-scope.docx"),
            new ProjectDocumentResponseDTO("c3d9f770-2b3c-4e7a-b1d5-95f9b289b3f3", "Relatório de Status", "XLSX", "/documents/project-status.xlsx")
        );
    }

}
