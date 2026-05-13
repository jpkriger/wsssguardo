package wsssguardo.find.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.find.Find;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.mapper.FindMapper;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class FindServiceTest {

    @Mock
    private FindRepository repository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private FindMapper mapper;

    @InjectMocks
    private FindService service;

    @Test
    void getFindingNameByProjectIdShouldReturnMappedFindingNames() {
        UUID projectId = UUID.randomUUID();
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        
        Find olderFind = find(firstId, "Achado anterior");
        Find newerFind = find(secondId, "Achado recente");

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(repository.findAllByProjectIdOrderByCreatedAtDesc(projectId)).thenReturn(List.of(
            newerFind,
            olderFind
        ));
        when(mapper.toNameResponse(newerFind)).thenReturn(new FindNameResponseDTO(secondId, "Achado recente"));
        when(mapper.toNameResponse(olderFind)).thenReturn(new FindNameResponseDTO(firstId, "Achado anterior"));

        List<FindNameResponseDTO> response = service.getFindingNameByProjectId(projectId);

        assertEquals(2, response.size());
        assertEquals(secondId, response.get(0).id());
        assertEquals("Achado recente", response.get(0).name());
        assertEquals(firstId, response.get(1).id());
        assertEquals("Achado anterior", response.get(1).name());
        verify(projectRepository).findById(projectId);
        verify(repository).findAllByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Test
    void getFindingNameByProjectIdShouldThrowWhenProjectDoesNotExist() {
        UUID projectId = UUID.randomUUID();

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getFindingNameByProjectId(projectId));
        verify(projectRepository).findById(projectId);
        verifyNoInteractions(repository);
    }

    private static Find find(UUID id, String name) {
        Find find = new Find();
        find.setId(id);
        find.setName(name);
        find.setCreatedAt(LocalDateTime.now());
        return find;
    }
}
