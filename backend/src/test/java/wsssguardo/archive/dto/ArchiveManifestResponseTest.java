package wsssguardo.archive.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import wsssguardo.archive.ArchiveManifest;
import wsssguardo.archive.domain.ArchiveStatus;

class ArchiveManifestResponseTest {

    @Test
    void fromShouldMapAllFields() {
        ArchiveManifest manifest = ArchiveManifest.builder()
                .id(UUID.randomUUID())
                .projectId(UUID.randomUUID())
                .fileName("dump.zip")
                .sha256("abc123")
                .sizeBytes(1024L)
                .status(ArchiveStatus.PENDING_DOWNLOAD)
                .createdBy("tester")
                .createdAt(LocalDateTime.now())
                .confirmedBy(null)
                .confirmedAt(null)
                .build();

        ArchiveManifestResponse response = ArchiveManifestResponse.from(manifest);

        assertEquals(manifest.getId(), response.id());
        assertEquals(manifest.getProjectId(), response.projectId());
        assertEquals("dump.zip", response.fileName());
        assertEquals("abc123", response.sha256());
        assertEquals(1024L, response.sizeBytes());
        assertEquals(ArchiveStatus.PENDING_DOWNLOAD, response.status());
        assertEquals("tester", response.createdBy());
    }
}
