package wsssguardo.archive.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.bouncycastle.cms.CMSEnvelopedData;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.RecipientInformation;
import org.bouncycastle.cms.jcajce.JceKeyTransEnvelopedRecipient;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.persistence.EntityManager;
import wsssguardo.AbstractIntegrationTest;
import wsssguardo.archive.ArchiveManifest;
import wsssguardo.archive.ArchiveTestKeys;
import wsssguardo.archive.crypto.ArchiveKeyProvider;
import wsssguardo.archive.domain.ArchiveStatus;
import wsssguardo.archive.repository.ArchiveManifestRepository;
import wsssguardo.artifact.Artifact;
import wsssguardo.artifact.domain.ArtifactType;
import wsssguardo.asset.Asset;
import wsssguardo.company.Company;
import wsssguardo.find.Find;
import wsssguardo.project.Project;
import wsssguardo.project.domain.ProjectStatus;
import wsssguardo.project.domain.ProjectUser;
import wsssguardo.risk.Risk;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;

@Import(ArchiveControllerIntegrationTest.TestArchiveKeysConfig.class)
class ArchiveControllerIntegrationTest extends AbstractIntegrationTest {

    static final ArchiveTestKeys KEYS = new ArchiveTestKeys();

    @TestConfiguration
    static class TestArchiveKeysConfig {
        @Bean
        @Primary
        ArchiveKeyProvider testArchiveKeyProvider() {
            return KEYS::material;
        }
    }

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private EntityManager em;
    @Autowired
    private ArchiveManifestRepository manifestRepository;

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void archiveProducesEncryptedDumpAndMarksProjectArchived() throws Exception {
        UUID projectId = seedFullProject();

        byte[] body = mockMvc.perform(post("/api/projects/{id}/archive", projectId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/pkcs7-mime"))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(body).isNotEmpty();

        // Projeto marcado como ARCHIVED.
        Project project = em.find(Project.class, projectId);
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.ARCHIVED);

        // Manifesto registrado e pendente, com hash batendo com o arquivo.
        ArchiveManifest manifest = manifestRepository
                .findFirstByProjectIdOrderByCreatedAtDesc(projectId).orElseThrow();
        assertThat(manifest.getStatus()).isEqualTo(ArchiveStatus.PENDING_DOWNLOAD);
        assertThat(manifest.getSha256()).isEqualTo(sha256Hex(body));

        // O .p7m decripta+verifica e o JSON é o dump normalizado esperado.
        JsonNode dump = json.readTree(decryptAndVerify(body));
        assertThat(dump.get("schemaVersion").asInt()).isEqualTo(1);
        assertThat(dump.get("includesTombstones").asBoolean()).isTrue();
        assertThat(dump.get("assets")).hasSize(1);
        assertThat(dump.get("finds").get(0).get("assetIds")).hasSize(1);
        assertThat(dump.get("risks").get(0).get("findIds")).hasSize(1);
    }

    @Test
    void confirmWithWrongHashDoesNotPurge() throws Exception {
        UUID projectId = seedFullProject();
        mockMvc.perform(post("/api/projects/{id}/archive", projectId)).andExpect(status().isOk());

        String wrong = "0".repeat(64);
        mockMvc.perform(post("/api/projects/{id}/archive/confirm", projectId)
                .contentType(APPLICATION_JSON)
                .content("{\"sha256\":\"" + wrong + "\"}"))
                .andExpect(status().isBadRequest());

        assertThat(em.find(Project.class, projectId)).isNotNull();
    }

    @Test
    void confirmWithMatchingHashPurgesProject() throws Exception {
        UUID projectId = seedFullProject();
        byte[] body = mockMvc.perform(post("/api/projects/{id}/archive", projectId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();

        mockMvc.perform(post("/api/projects/{id}/archive/confirm", projectId)
                .contentType(APPLICATION_JSON)
                .content("{\"sha256\":\"" + sha256Hex(body) + "\"}"))
                .andExpect(status().isNoContent());

        em.flush();
        em.clear();
        assertThat(em.find(Project.class, projectId)).isNull();
        Number assets = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM assets WHERE project_id = :pid")
                .setParameter("pid", projectId).getSingleResult();
        assertThat(assets.longValue()).isZero();
    }

    @Test
    void archivingAlreadyArchivedReturnsConflict() throws Exception {
        UUID projectId = seedFullProject();
        mockMvc.perform(post("/api/projects/{id}/archive", projectId)).andExpect(status().isOk());
        mockMvc.perform(post("/api/projects/{id}/archive", projectId)).andExpect(status().isConflict());
    }

    // --- helpers ---

    private byte[] decryptAndVerify(byte[] p7m) throws Exception {
        CMSEnvelopedData enveloped = new CMSEnvelopedData(p7m);
        RecipientInformation recipient = enveloped.getRecipientInfos().getRecipients().iterator().next();
        byte[] signedBytes = recipient.getContent(new JceKeyTransEnvelopedRecipient(KEYS.recipientPrivateKey())
                .setProvider(BouncyCastleProvider.PROVIDER_NAME));
        CMSSignedData signedData = new CMSSignedData(signedBytes);
        return (byte[]) signedData.getSignedContent().getContent();
    }

    private String sha256Hex(byte[] data) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
    }

    private UUID seedFullProject() {
        Company company = persist(newCompany("Acme"));
        User user = persist(newUser());

        Project project = newProject(company);
        project = persist(project);

        ProjectUser pu = new ProjectUser();
        pu.setProject(project);
        pu.setUser(user);
        pu.setCreatedAt(LocalDateTime.now());
        persist(pu);

        Asset asset = newAsset(project);
        asset = persist(asset);
        Artifact artifact = newArtifact(project);
        artifact = persist(artifact);

        Find find = new Find();
        find.setName("Porta aberta");
        find.setProject(project);
        find.setCreatedAt(LocalDateTime.now());
        find.setAssets(List.of(asset));
        find.setArtifacts(List.of(artifact));
        find = persist(find);

        Risk risk = new Risk();
        risk.setName("Exposição");
        risk.setProject(project);
        risk.setCreatedAt(LocalDateTime.now());
        risk.setFinds(new java.util.ArrayList<>(List.of(find)));
        persist(risk);

        em.flush();
        return project.getId();
    }

    private <T> T persist(T entity) {
        em.persist(entity);
        return entity;
    }

    private Company newCompany(String name) {
        Company c = new Company();
        c.setName(name);
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    private User newUser() {
        User u = new User();
        u.setFirstName("Ana");
        u.setLastName("Silva");
        u.setEmail("ana-" + UUID.randomUUID() + "@test.com");
        u.setCognitoSub(UUID.randomUUID().toString());
        u.setRole(UserRole.CONSULTANT);
        u.setCreatedAt(LocalDateTime.now());
        return u;
    }

    private Project newProject(Company company) {
        Project p = new Project();
        p.setName("Auditoria");
        p.setCompany(company);
        p.setStartDate(LocalDate.of(2026, 1, 1));
        p.setEndDate(LocalDate.of(2026, 6, 1));
        p.setStatus(ProjectStatus.COMPLETED);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    private Asset newAsset(Project project) {
        Asset a = new Asset();
        a.setName("Servidor X");
        a.setDescription("desc");
        a.setContent("conteudo");
        a.setProject(project);
        a.setCreatedAt(LocalDateTime.now());
        return a;
    }

    private Artifact newArtifact(Project project) {
        Artifact a = new Artifact();
        a.setName("Relatório");
        a.setType(ArtifactType.DOCUMENT);
        a.setProject(project);
        a.setCreatedAt(LocalDateTime.now());
        return a;
    }
}
