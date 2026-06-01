package wsssguardo.report.dto;

import java.util.List;
import wsssguardo.project.dto.ProjectSummaryDTO;
import wsssguardo.find.dto.responsedto.FindResponseDTO;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.artifact.dto.responsedto.ArtifactResponseDTO;
import wsssguardo.risk.dto.responsedto.RiskPageResponseDTO;

public class ReportProjectData {
    public ProjectSummaryDTO projectSummary;
    public List<FindResponseDTO> findings;
    public java.util.List<AssetResponseDTO> assets;
    public java.util.List<ArtifactResponseDTO> artifacts;
    public RiskPageResponseDTO risksPage;

    public boolean isEmpty() {
        boolean noFindings = findings == null || findings.isEmpty();
        boolean noAssets = assets == null || assets.isEmpty();
        boolean noArtifacts = artifacts == null || artifacts.isEmpty();
        boolean noRisks = (risksPage == null) || (risksPage.content() == null) || risksPage.content().isEmpty();
        return noFindings && noAssets && noArtifacts && noRisks;
    }
}
