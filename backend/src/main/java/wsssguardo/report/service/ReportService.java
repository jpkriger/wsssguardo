package wsssguardo.report.service;

import wsssguardo.report.dto.ReportGenerateRequest;
import wsssguardo.report.dto.ReportGenerateResponse;

public interface ReportService {
    ReportGenerateResponse generateReport(ReportGenerateRequest request);
}
