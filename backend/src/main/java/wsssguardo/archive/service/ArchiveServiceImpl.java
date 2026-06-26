package wsssguardo.archive.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import wsssguardo.archive.ArchiveManifest;
import wsssguardo.archive.crypto.ArchiveCryptoService;
import wsssguardo.archive.domain.ArchiveStatus;
import wsssguardo.archive.dto.ArchiveDownload;
import wsssguardo.archive.dto.ArchiveManifestResponse;
import wsssguardo.archive.dto.export.ProjectArchiveDTO;
import wsssguardo.archive.repository.ArchiveManifestRepository;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.repository.ProjectRepository;
import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.shared.security.AuthenticatedUser;
import wsssguardo.user.User;

@Service
@RequiredArgsConstructor
public class ArchiveServiceImpl implements ArchiveService {

    private static final DateTimeFormatter FILE_TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    // Serialização canônica e determinística (chaves ordenadas) para hash/assinatura reproduzíveis.
    private static final ObjectMapper CANONICAL = JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
            .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
            .build();

    // Ordem de purga respeitando FKs: join tables → entidades filhas → projeto.
    private static final String[] PURGE_STATEMENTS = {
            "DELETE FROM finds_assets WHERE find_id IN (SELECT id FROM finds WHERE project_id = :pid)",
            "DELETE FROM finds_artifacts WHERE find_id IN (SELECT id FROM finds WHERE project_id = :pid)",
            "DELETE FROM risks_finds WHERE risk_id IN (SELECT id FROM risks WHERE project_id = :pid)",
            "DELETE FROM risks WHERE project_id = :pid",
            "DELETE FROM finds WHERE project_id = :pid",
            "DELETE FROM artifacts WHERE project_id = :pid",
            "DELETE FROM assets WHERE project_id = :pid",
            "DELETE FROM project_users WHERE project_id = :pid",
            "DELETE FROM projects WHERE id = :pid"
    };

    private final ProjectRepository projectRepository;
    private final ArchiveManifestRepository manifestRepository;
    private final ProjectArchiveExporter exporter;
    private final ArchiveCryptoService cryptoService;
    private final AuthenticatedUser authenticatedUser;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public ArchiveDownload archiveProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new ApiException("Projeto já está arquivado", HttpStatus.CONFLICT);
        }

        // Status muda antes do export para que o dump reflita ARCHIVED.
        project.setStatus(ProjectStatus.ARCHIVED);

        ProjectArchiveDTO dump = exporter.export(projectId);
        byte[] json = toCanonicalJson(dump);
        byte[] p7m = cryptoService.signAndEnvelope(json);
        String sha256 = sha256Hex(p7m);
        String fileName = "project-%s-%s.p7m".formatted(
                projectId, LocalDateTime.now().format(FILE_TIMESTAMP));

        manifestRepository.save(ArchiveManifest.builder()
                .projectId(projectId)
                .projectName(project.getName())
                .fileName(fileName)
                .sha256(sha256)
                .sizeBytes(p7m.length)
                .status(ArchiveStatus.PENDING_DOWNLOAD)
                .createdBy(currentUser())
                .build());

        return new ArchiveDownload(fileName, p7m);
    }

    @Override
    @Transactional
    public void confirmArchive(UUID projectId, String sha256) {
        ArchiveManifest manifest = manifestRepository
                .findFirstByProjectIdAndStatusOrderByCreatedAtDesc(projectId, ArchiveStatus.PENDING_DOWNLOAD)
                .orElseThrow(() -> new ApiException(
                        "Nenhum arquivamento pendente de confirmação para este projeto",
                        HttpStatus.NOT_FOUND));

        if (!manifest.getSha256().equalsIgnoreCase(sha256)) {
            throw new ApiException(
                    "SHA-256 informado não confere com o do dump gerado; purga abortada",
                    HttpStatus.BAD_REQUEST);
        }

        manifest.setStatus(ArchiveStatus.CONFIRMED);
        manifest.setConfirmedBy(currentUser());
        manifest.setConfirmedAt(LocalDateTime.now());

        purgeProject(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ArchiveManifestResponse> latestManifest(UUID projectId) {
        return manifestRepository.findFirstByProjectIdOrderByCreatedAtDesc(projectId)
                .map(ArchiveManifestResponse::from);
    }

    private void purgeProject(UUID projectId) {
        for (String sql : PURGE_STATEMENTS) {
            entityManager.createNativeQuery(sql)
                    .setParameter("pid", projectId)
                    .executeUpdate();
        }
    }

    private byte[] toCanonicalJson(ProjectArchiveDTO dump) {
        try {
            return CANONICAL.writeValueAsBytes(dump);
        } catch (Exception e) {
            throw new ApiException("Falha ao serializar o dump: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String sha256Hex(byte[] data) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new ApiException("Falha ao calcular SHA-256: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String currentUser() {
        User user = authenticatedUser.get();
        if (user == null) {
            return null;
        }
        return user.getEmail() != null ? user.getEmail() : String.valueOf(user.getId());
    }
}
