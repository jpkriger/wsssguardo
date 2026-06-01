import { type ReactElement } from "react";
import { useParams } from "react-router";

import ReportHeader from "@/components/ReportTemplate/ReportHeader/ReportHeader";
import ExecutiveSummary from "@/components/ReportTemplate/ExecutiveSummary/ExecutiveSummary";
import RiskOverview from "@/components/ReportTemplate/RiskOverview/RiskOverview";
import RiskAnalysis from "@/components/ReportTemplate/RiskAnalysis/RiskAnalysis";
import BusinessImpactAssessment from "@/components/ReportTemplate/BusinessImpactAssessment/BusinessImpactAssessment";

export default function ProjectReportFullscreen(): ReactElement {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex w-[80vw] max-w-[1600px] flex-col gap-8 px-6 py-8">
        <ReportHeader projectId={projectId} />
        <ExecutiveSummary projectId={projectId} />
        <RiskOverview projectId={projectId} />
        <RiskAnalysis projectId={projectId} />
        <BusinessImpactAssessment />
      </div>
    </main>
  );
}
