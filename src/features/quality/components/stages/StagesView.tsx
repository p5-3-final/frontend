import { AlertReportPanel } from "./AlertReportPanel";
import { SourceStageReport } from "./SourceStageReport";
import { StageTrend } from "./StageTrend";

/** 처리 단계 탭(SPEC-035 R-14, R-15, R-22) */
export function StagesView() {
  return (
    <section aria-labelledby="stages-heading" className="flex flex-col gap-4">
      <h2 id="stages-heading" className="text-lg font-semibold">
        처리 단계
      </h2>
      <SourceStageReport />
      <StageTrend />
      <AlertReportPanel />
    </section>
  );
}
