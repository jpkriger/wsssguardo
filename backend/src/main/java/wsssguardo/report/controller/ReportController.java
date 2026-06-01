package wsssguardo.report.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wsssguardo.report.dto.ReportGenerateRequest;
import wsssguardo.report.dto.ReportGenerateResponse;
import wsssguardo.report.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ReportGenerateResponse> generate(@RequestBody ReportGenerateRequest req) {
        ReportGenerateResponse resp = reportService.generateReport(req);
        return ResponseEntity.ok(resp);
    }
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getPdf(@PathVariable("id") String id) throws java.io.IOException {
        java.nio.file.Path p = java.nio.file.Paths.get("reports").resolve(id + ".pdf");
        if (!java.nio.file.Files.exists(p)) return ResponseEntity.notFound().build();
        byte[] data = java.nio.file.Files.readAllBytes(p);
        return ResponseEntity.ok().header("Content-Type", "application/pdf").body(data);
    }

    @GetMapping("/{id}/html")
    public ResponseEntity<byte[]> getHtml(@PathVariable("id") String id) throws java.io.IOException {
        java.nio.file.Path p = java.nio.file.Paths.get("reports").resolve(id + ".html");
        if (!java.nio.file.Files.exists(p)) return ResponseEntity.notFound().build();
        byte[] data = java.nio.file.Files.readAllBytes(p);
        return ResponseEntity.ok().header("Content-Type", "text/html; charset=utf-8").body(data);
    }
}
