package wsssguardo.company.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.company.Company;
import wsssguardo.company.dto.requestdto.CompanyRequestDTO;
import wsssguardo.company.dto.requestdto.CompanyUpdateRequestDTO;
import wsssguardo.company.dto.responsedto.CompanyResponseDTO;
import wsssguardo.company.dto.responsedto.CompanyWithProjectsDTO;
import wsssguardo.company.mapper.CompanyMapper;
import wsssguardo.company.mapper.CompanyUpdateMapper;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository repository;
    private final ProjectRepository projectRepository;
    private final CompanyMapper mapper;
    private final CompanyUpdateMapper updateMapper;
    private final ProjectMapper projectMapper;

    public List<CompanyResponseDTO> list() {
        return repository.findAll()
                .stream()
                .map(mapper::toResponseDTO)
                .toList();
    }

    public List<CompanyWithProjectsDTO> listWithProjects() {
        return repository.findAll()
                .stream()
                .map(company -> {
                    var projects = projectRepository.findByCompanyId(company.getId())
                            .stream()
                            .map(projectMapper::toResponse)
                            .toList();
                    return new CompanyWithProjectsDTO(
                            company.getId(),
                            company.getName(),
                            company.getCreatedAt(),
                            projects
                    );
                })
                .toList();
    }

    @Transactional
    public CompanyResponseDTO create(CompanyRequestDTO dto) {
        Company company = mapper.toEntity(dto);
        repository.save(company);
        return mapper.toResponseDTO(company);
    }

    @Transactional
    public CompanyResponseDTO update(UUID id, CompanyUpdateRequestDTO dto) {
        Company company = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));

        updateMapper.update(company, dto);

        return mapper.toResponseDTO(company);
    }

    @Transactional
    public void delete(UUID id) {
        Company company = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));

        if (!projectRepository.findByCompanyId(id).isEmpty()) {
            throw new ApiException("Cannot delete company with linked projects", HttpStatus.CONFLICT);
        }

        repository.delete(company);
    }
}
