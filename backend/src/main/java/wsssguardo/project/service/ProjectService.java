package wsssguardo.project.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
import wsssguardo.artifact.repository.ArtifactRepository;
import wsssguardo.asset.repository.AssetRepository;
import wsssguardo.company.Company;
import wsssguardo.company.repository.CompanyRepository;
import wsssguardo.find.repository.FindRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.project.domain.projectConfiguration.ProjectConfiguration;
import wsssguardo.project.domain.projectConfiguration.RiskCategory;
import wsssguardo.project.domain.projectConfiguration.RiskConfig;
import wsssguardo.project.dto.ProjectCreateRequest;
import wsssguardo.project.dto.ProjectResponse;
import wsssguardo.project.dto.ProjectSummaryDTO;
import wsssguardo.project.dto.ProjectUpdateRequest;
import wsssguardo.project.dto.RiskCategoryDTO;
import wsssguardo.project.dto.RiskConfigUpdateDTO;
import wsssguardo.project.mapper.ProjectMapper;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.risk.repository.RiskRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository repository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final ArtifactRepository artifactRepository;
    private final FindRepository findRepository;
    private final RiskRepository riskRepository;
    private final ProjectMapper mapper;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listAllProjects() {
        List<UUID> accessible = projectAccessService.getAccessibleProjectIds();
        return repository.findAllByIdIn(accessible).stream()
                .sorted(Comparator.comparing(Project::getCreatedAt).reversed())
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> projectsById(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<UUID> accessible = projectAccessService.getAccessibleProjectIds();
        Map<UUID, Project> projectsById = repository.findAllById(ids).stream()
                .filter(p -> accessible.contains(p.getId()))
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
        // Retorna somente a interseção com os projetos acessíveis ao usuário corrente.
        List<UUID> accessible = projectAccessService.getAccessibleProjectIds();
        return repository.findProjectIdsByUserId(userId).stream()
                .filter(accessible::contains)
                .toList();
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        validateDateRange(request.startDate(), request.endDate());
        validateRiskConfig(request.riskConfig());

        Company company = companyRepository.findById(request.companyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", request.companyId()));
        List<ProjectUser> projectUsers = buildProjectUsers(request.consultantIds());

        RiskConfig riskConfig = RiskConfig.builder()
                .minRange(request.riskConfig().minRange())
                .maxRange(request.riskConfig().maxRange())
                .categories(request.riskConfig().categories().stream()
                        .map(cat -> RiskCategory.builder()
                                .label(cat.label())
                                .minRange(cat.minRange())
                                .maxRange(cat.maxRange())
                                .build())
                        .toList())
                .build();

        ProjectConfiguration configuration = ProjectConfiguration.builder()
                .riskConfig(riskConfig)
                .build();

        Project project = Project.builder()
                .name(request.name().trim())
                .company(company)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(ProjectStatus.IN_PROGRESS)
                .configuration(configuration)
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

        if (request.status() != null) {
            project.setStatus(request.status());
        }

        return mapper.toResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectSummaryDTO getSummary(UUID projectId) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        long assetCount    = assetRepository.countByProjectId(projectId);
        long artifactCount = artifactRepository.countByProjectId(projectId);
        long findingCount  = findRepository.countByProjectId(projectId);
        long riskCount     = riskRepository.countByProjectId(projectId);

        List<RiskCategory> categories = project.getConfiguration().getRiskConfig().getCategories();
        List<Integer> riskLevels      = riskRepository.findRiskLevelsByProjectId(projectId);
        long[] counts = classifyRisks(riskLevels, categories);

        LocalDate endDate       = project.getEndDate();
        Integer daysRemaining   = endDate != null
                ? (int) ChronoUnit.DAYS.between(LocalDate.now(), endDate)
                : null;

        return new ProjectSummaryDTO(
                assetCount, artifactCount, findingCount, riskCount,
                counts[2], counts[1], counts[0],
            endDate, daysRemaining
        );
    }

    /** Returns [low, medium, high] counts indexed by category position (sorted by minRange). */
    private long[] classifyRisks(List<Integer> riskLevels, List<RiskCategory> categories) {
        if (categories.isEmpty() || riskLevels.isEmpty()) return new long[]{0, 0, 0};

        List<RiskCategory> sorted = categories.stream()
                .sorted(Comparator.comparingInt(RiskCategory::getMinRange))
                .toList();

        long low = 0, medium = 0, high = 0;
        for (Integer level : riskLevels) {
            int idx = -1;
            for (int i = 0; i < sorted.size(); i++) {
                RiskCategory cat = sorted.get(i);
                if (level >= cat.getMinRange() && level <= cat.getMaxRange()) {
                    idx = i;
                    break;
                }
            }
            if (idx == 0) low++;
            else if (idx == sorted.size() - 1) high++;
            else if (idx > 0) medium++;
        }
        return new long[]{low, medium, high};
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

    private void validateRiskConfig(RiskConfigUpdateDTO riskConfig) {
        if (riskConfig == null) {
            throw new ApiException("riskConfig must not be null", HttpStatus.BAD_REQUEST);
        }

        if (riskConfig.minRange() == null || riskConfig.maxRange() == null) {
            throw new ApiException("minRange and maxRange must not be null", HttpStatus.BAD_REQUEST);
        }

        if (riskConfig.minRange() >= riskConfig.maxRange()) {
            throw new ApiException("minRange must be less than maxRange", HttpStatus.BAD_REQUEST);
        }

        if (riskConfig.categories() == null || riskConfig.categories().isEmpty()) {
            throw new ApiException("categories must not be empty", HttpStatus.BAD_REQUEST);
        }

        // Validate each category
        for (RiskCategoryDTO category : riskConfig.categories()) {
            if (category.label() == null || category.label().isBlank()) {
                throw new ApiException("category label must not be blank", HttpStatus.BAD_REQUEST);
            }

            if (category.minRange() == null || category.maxRange() == null) {
                throw new ApiException("category minRange and maxRange must not be null", HttpStatus.BAD_REQUEST);
            }

            if (category.minRange() >= category.maxRange()) {
                throw new ApiException("category minRange must be less than maxRange", HttpStatus.BAD_REQUEST);
            }

            // Validate that category ranges are within project range
            if (category.minRange() < riskConfig.minRange() || category.maxRange() > riskConfig.maxRange()) {
                throw new ApiException("category ranges must be within project minRange and maxRange",
                        HttpStatus.BAD_REQUEST);
            }
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
                        .build())
                .toList();
    }
}
