package wsssguardo.risk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import wsssguardo.project.Project;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.Risk;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;
import wsssguardo.risk.mapper.RiskMapper;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class RiskServiceTest {

    @Mock
    private RiskRepository riskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private RiskMapper riskMapper;

    @InjectMocks
    private RiskService riskService;

    @Test
    @DisplayName("Should return a page of risks when project exists")
    void findAllByProject_WhenProjectExists_ShouldReturnPage() {
        // Arrange
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        
        Project project = new Project();
        project.setId(projectId);
        
        Page<Risk> riskPage = new PageImpl<>(List.of(new Risk()));
        RiskPageResponseDTO expectedDTO = new RiskPageResponseDTO(List.of(), 0, 10, 1, 1, true, true);
        
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(riskRepository.findAllByProjectId(projectId, pageable)).thenReturn(riskPage);
        when(riskMapper.toPageDTO(eq(riskPage), any())).thenReturn(expectedDTO);

        // Act
        RiskPageResponseDTO result = riskService.findAllByProject(projectId, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(expectedDTO);
        
        verify(projectRepository).findById(projectId);
        verify(riskRepository).findAllByProjectId(projectId, pageable);
        verify(riskMapper).toPageDTO(eq(riskPage), any());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when project does not exist")
    void findAllByProject_WhenProjectDoesNotExist_ShouldThrowException() {
        // Arrange
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> riskService.findAllByProject(projectId, pageable))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project");
                
        verify(projectRepository).findById(projectId);
        verifyNoInteractions(riskRepository);
        verifyNoInteractions(riskMapper);
    }

    @Test
    @DisplayName("Should transparently return only non-deleted risks (delegating to repository)")
    void findAllByProject_WithExcludedRisks_ShouldNotReturnExcludedRisks() {
        // Arrange
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        
        Project project = new Project();
        project.setId(projectId);
        
        // Simulating the repository returning only the active risks (since Hibernate handles @SQLRestriction)
        Risk activeRisk = new Risk();
        activeRisk.setId(UUID.randomUUID());
        
        Page<Risk> repositoryPage = new PageImpl<>(List.of(activeRisk));
        RiskPageResponseDTO expectedDTO = new RiskPageResponseDTO(List.of(), 0, 10, 1, 1, true, true);
        
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(riskRepository.findAllByProjectId(projectId, pageable)).thenReturn(repositoryPage);
        when(riskMapper.toPageDTO(eq(repositoryPage), any())).thenReturn(expectedDTO);

        // Act
        RiskPageResponseDTO result = riskService.findAllByProject(projectId, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(expectedDTO);
        verify(riskRepository).findAllByProjectId(projectId, pageable);
    }

    @Test
    @DisplayName("Should handle unpaged requests correctly")
    void findAllByProject_WithUnpaged_ShouldReturnAllRecords() {
        // Arrange
        UUID projectId = UUID.randomUUID();
        Pageable unpaged = Pageable.unpaged();
        
        Project project = new Project();
        project.setId(projectId);
        
        Page<Risk> riskPage = new PageImpl<>(List.of(new Risk(), new Risk()));
        RiskPageResponseDTO expectedDTO = new RiskPageResponseDTO(List.of(), 0, 2, 2, 1, true, true);
        
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(riskRepository.findAllByProjectId(projectId, unpaged)).thenReturn(riskPage);
        when(riskMapper.toPageDTO(eq(riskPage), any())).thenReturn(expectedDTO);

        // Act
        RiskPageResponseDTO result = riskService.findAllByProject(projectId, unpaged);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(expectedDTO);
        verify(riskRepository).findAllByProjectId(projectId, unpaged);
    }

    @Test
    @DisplayName("Should handle empty pages gracefully")
    void findAllByProject_WhenPageIsEmpty_ShouldReturnEmptyPageDTO() {
        // Arrange
        UUID projectId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(5, 10); // Page out of bounds
        
        Project project = new Project();
        project.setId(projectId);
        
        Page<Risk> emptyPage = new PageImpl<>(List.of(), pageable, 10); // total 10, page 5 is empty
        RiskPageResponseDTO expectedDTO = new RiskPageResponseDTO(List.of(), 5, 10, 10, 1, false, true);
        
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(riskRepository.findAllByProjectId(projectId, pageable)).thenReturn(emptyPage);
        when(riskMapper.toPageDTO(eq(emptyPage), any())).thenReturn(expectedDTO);

        // Act
        RiskPageResponseDTO result = riskService.findAllByProject(projectId, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(expectedDTO);
        verify(riskRepository).findAllByProjectId(projectId, pageable);
    }
}