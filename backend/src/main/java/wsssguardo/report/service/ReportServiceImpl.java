package wsssguardo.report.service;

import org.springframework.stereotype.Service;
import wsssguardo.report.dto.*;
import wsssguardo.report.renderer.ReportHtmlComposer;
import wsssguardo.report.renderer.ReportPdfRenderer;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.UUID;

@Service
public class ReportServiceImpl implements ReportService {
    private final ReportHtmlComposer composer;
    private final ReportPdfRenderer renderer;
    private final wsssguardo.report.storage.ReportStorageService storage;
    private final wsssguardo.project.service.ProjectService projectService;
    private final wsssguardo.find.service.FindService findService;
    private final wsssguardo.asset.service.AssetService assetService;
    private final wsssguardo.artifact.service.ArtifactService artifactService;
    private final wsssguardo.risk.service.RiskService riskService;

    public ReportServiceImpl(ReportHtmlComposer composer,
                             ReportPdfRenderer renderer,
                             wsssguardo.report.storage.ReportStorageService storage,
                             wsssguardo.project.service.ProjectService projectService,
                             wsssguardo.find.service.FindService findService,
                             wsssguardo.asset.service.AssetService assetService,
                             wsssguardo.artifact.service.ArtifactService artifactService,
                             wsssguardo.risk.service.RiskService riskService) {
        this.composer = composer;
        this.renderer = renderer;
        this.storage = storage;
        this.projectService = projectService;
        this.findService = findService;
        this.assetService = assetService;
        this.artifactService = artifactService;
        this.riskService = riskService;
    }

    @Override
    public ReportGenerateResponse generateReport(ReportGenerateRequest request) {
        // validate project exists and aggregate data
        java.util.UUID projectUuid = null;
        try {
            projectUuid = java.util.UUID.fromString(request.projectId);
        } catch (Exception e) {
            throw new wsssguardo.shared.exception.ApiException("Invalid projectId", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        var data = new wsssguardo.report.dto.ReportProjectData();
        data.projectSummary = projectService.getSummary(projectUuid);
        data.findings = findService.listByProject(projectUuid);
        data.assets = assetService.findAllByProject(projectUuid, org.springframework.data.domain.Pageable.unpaged()).content();
        data.artifacts = artifactService.listByProject(projectUuid, null);
        data.risksPage = riskService.findAllByProject(projectUuid, org.springframework.data.domain.Pageable.unpaged());

        if (data.isEmpty()) {
            throw new wsssguardo.shared.exception.ApiException("No data available for project", org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
        }

        String html = composer.compose(request, data);
        ReportGenerateResponse resp = new ReportGenerateResponse();
        resp.reportId = UUID.randomUUID().toString();
        resp.projectId = request.projectId;
        resp.generatedAt = OffsetDateTime.now();
        try {
            byte[] pdf = renderer.renderPdf(html);
            // persist PDF and HTML to storage
            String pdfUrl = storage.savePdf(resp.reportId, pdf);
            String htmlUrl = storage.saveHtml(resp.reportId, html.getBytes());

            ReportArtifact pdfArt = new ReportArtifact();
            pdfArt.fileName = resp.reportId + ".pdf";
            pdfArt.contentType = "application/pdf";
            pdfArt.url = pdfUrl;

            ReportArtifact htmlArt = new ReportArtifact();
            htmlArt.fileName = resp.reportId + ".html";
            htmlArt.contentType = "text/html";
            htmlArt.url = htmlUrl;

            var artifacts = new HashMap<String, ReportArtifact>();
            artifacts.put("pdf", pdfArt);
            artifacts.put("html", htmlArt);
            resp.artifacts = artifacts;
            resp.status = "generated";
        } catch (Exception e) {
            throw new wsssguardo.shared.exception.ApiException("PDF renderer failed: " + e.getMessage(), org.springframework.http.HttpStatus.BAD_GATEWAY);
        }
        return resp;
    }
}
