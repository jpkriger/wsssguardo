package wsssguardo.project.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import wsssguardo.customer.Customer;
import wsssguardo.customer.repository.CustomerRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.domain.UserProjectLevel;
import wsssguardo.project.dto.ProjectCreateRequest;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.dto.ProjectUpdateRequest;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository repository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ProjectMapper mapper;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listAllProjects() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> projectsById(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Map<UUID, Project> projectsById = repository.findAllById(ids).stream()
            .collect(Collectors.toMap(Project::getId, Function.identity()));

        return ids.stream()
            .map(projectsById::get)
            .filter(Objects::nonNull)
            .map(mapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> projectsByUserId(UUID userId) {
        if (userId == null) {
            return List.of();
        }

        return repository.findProjectIdsByUserId(userId);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        validateDateRange(request.startDate(), request.endDate());

        Customer customer = customerRepository.findById(request.customerId())
            .orElseThrow(() -> new ResourceNotFoundException("Customer", request.customerId()));
        List<ProjectUser> projectUsers = buildProjectUsers(request.consultantIds());

        Project project = Project.builder()
            .name(request.name().trim())
            .customer(customer)
            .startDate(request.startDate())
            .endDate(request.endDate())
            .status(ProjectStatus.IN_PROGRESS)
            .build();

        projectUsers.forEach(projectUser -> projectUser.setProject(project));
        project.setProjectUsers(projectUsers);

        Project savedProject = repository.save(project);
        return mapper.toResponse(savedProject);
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, ProjectUpdateRequest request) {
        Project project = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));

        LocalDate nextStartDate = request.startDate() != null ? request.startDate() : project.getStartDate();
        LocalDate nextEndDate = request.endDate() != null ? request.endDate() : project.getEndDate();
        validateDateRange(nextStartDate, nextEndDate);

        if (request.name() != null) {
            String normalizedName = request.name().trim();
            if (normalizedName.isEmpty()) {
                throw new ApiException("name must not be blank", HttpStatus.BAD_REQUEST);
            }
            project.setName(normalizedName);
        }

        if (request.customerId() != null) {
            Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", request.customerId()));
            project.setCustomer(customer);
        }

        if (request.startDate() != null) {
            project.setStartDate(request.startDate());
        }

        if (request.endDate() != null) {
            project.setEndDate(request.endDate());
        }

        if (request.consultantIds() != null) {
            List<ProjectUser> projectUsers = buildProjectUsers(request.consultantIds());
            projectUsers.forEach(projectUser -> projectUser.setProject(project));
            project.setProjectUsers(projectUsers);
        }

        return mapper.toResponse(project);
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));

        repository.delete(project);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new ApiException("endDate must be equal to or after startDate", HttpStatus.BAD_REQUEST);
        }
    }

    private List<ProjectUser> buildProjectUsers(List<UUID> consultantIds) {
        if (consultantIds == null || consultantIds.isEmpty()) {
            return List.of();
        }

        List<UUID> uniqueConsultantIds = consultantIds.stream().distinct().toList();
        List<User> users = userRepository.findAllById(uniqueConsultantIds);
        Set<UUID> foundIds = users.stream().map(User::getId).collect(Collectors.toSet());
        List<UUID> missingIds = uniqueConsultantIds.stream()
            .filter(id -> !foundIds.contains(id))
            .toList();

        if (!missingIds.isEmpty()) {
            throw new ResourceNotFoundException("User", missingIds.get(0));
        }

        Map<UUID, User> usersById = users.stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        return uniqueConsultantIds.stream()
            .map(userId -> ProjectUser.builder()
                .user(usersById.get(userId))
                .accessLevel(UserProjectLevel.EDITOR)
                .build())
            .toList();
    }
}
