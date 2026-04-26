package wsssguardo.find.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.mapper.FindMapper;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class FindServiceImpl implements FindService {

    private final FindRepository repository;
    private final ProjectRepository projectRepository;
    private final FindMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<FindNameResponseDTO> getFindingNameByProjectId(UUID projectId) {
        requireProjectExists(projectId);

        return repository.findAllByProjectIdOrderByCreatedAtDesc(projectId).stream()
            .map(mapper::toNameResponse)
            .toList();
    }

    private void requireProjectExists(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }
    }
}
