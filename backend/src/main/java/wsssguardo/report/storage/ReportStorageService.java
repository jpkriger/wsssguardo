package wsssguardo.report.storage;

public interface ReportStorageService {
    // Save PDF bytes and return public URL (relative path)
    String savePdf(String reportId, byte[] pdf) throws Exception;

    // Save HTML bytes and return public URL (relative path)
    String saveHtml(String reportId, byte[] html) throws Exception;

    // Get filesystem path for a stored artifact
    java.nio.file.Path pathFor(String reportId, String ext);
}
