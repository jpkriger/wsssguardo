package wsssguardo.report.storage;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class ReportFileStorageImpl implements ReportStorageService {
    private final Path baseDir = Paths.get("reports");

    public ReportFileStorageImpl() throws IOException {
        if (!Files.exists(baseDir)) {
            Files.createDirectories(baseDir);
        }
    }

    @Override
    public String savePdf(String reportId, byte[] pdf) throws IOException {
        Path p = baseDir.resolve(reportId + ".pdf");
        Files.write(p, pdf);
        return "/api/reports/" + reportId + "/pdf";
    }

    @Override
    public String saveHtml(String reportId, byte[] html) throws IOException {
        Path p = baseDir.resolve(reportId + ".html");
        Files.write(p, html);
        return "/api/reports/" + reportId + "/html";
    }

    @Override
    public Path pathFor(String reportId, String ext) {
        return baseDir.resolve(reportId + "." + ext);
    }
}
