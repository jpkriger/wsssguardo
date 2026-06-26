package wsssguardo.archive.controller;

import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.archive.dto.ArchiveConfirmRequest;
import wsssguardo.archive.dto.ArchiveDownload;
import wsssguardo.archive.dto.ArchiveManifestResponse;
import wsssguardo.archive.service.ArchiveService;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.shared.security.ProjectAccessService;

@Tag(name = "Archive", description = "Arquivamento seguro de projetos")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{id}/archive")
public class ArchiveController {

    private static final MediaType PKCS7_MIME = MediaType.parseMediaType("application/pkcs7-mime");

    private final ArchiveService service;
    private final ProjectAccessService projectAccessService;

    @Operation(summary = "Arquivar projeto: gera e baixa o dump assinado+encriptado (.p7m)")
    @PostMapping
    public ResponseEntity<byte[]> archive(@PathVariable UUID id) {
        projectAccessService.assertManager();
        ArchiveDownload download = service.archiveProject(id);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.fileName())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(PKCS7_MIME)
                .body(download.content());
    }

    @Operation(summary = "Confirmar backup (hash) e purgar as linhas do projeto")
    @PostMapping("/confirm")
    public ResponseEntity<Void> confirm(@PathVariable UUID id,
            @Valid @RequestBody ArchiveConfirmRequest request) {
        projectAccessService.assertManager();
        service.confirmArchive(id, request.sha256());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Status do último arquivamento do projeto")
    @GetMapping("/manifest")
    public ResponseEntity<ArchiveManifestResponse> manifest(@PathVariable UUID id) {
        projectAccessService.assertManager();
        return ResponseEntity.ok(service.latestManifest(id)
                .orElseThrow(() -> new ResourceNotFoundException("ArchiveManifest", id)));
    }
}
