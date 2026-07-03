package wsssguardo.archive.service;

import java.util.Optional;
import java.util.UUID;

import wsssguardo.archive.dto.ArchiveDownload;
import wsssguardo.archive.dto.ArchiveManifestResponse;

public interface ArchiveService {

    /** Marca o projeto como ARCHIVED, gera o dump assinado+encriptado e registra o manifesto. */
    ArchiveDownload archiveProject(UUID projectId);

    /** Confirma o backup (conferindo o hash) e purga as linhas do projeto do banco. */
    void confirmArchive(UUID projectId, String sha256);

    /** Último manifesto de arquivamento do projeto, se houver. */
    Optional<ArchiveManifestResponse> latestManifest(UUID projectId);
}
