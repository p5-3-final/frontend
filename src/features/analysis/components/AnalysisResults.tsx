import type { PlayerController } from "../../player";
import { Panel } from "../../../shared/ui/Panel";
import { ANALYSIS_NOT_ANALYZED_MESSAGE } from "../../../shared/lib/messages";
import { useSourceSummary } from "../api/useSourceSummary";
import { SummaryPanel } from "./SummaryPanel";

export interface AnalysisResultsProps {
  sourceId: string;
  controller: PlayerController;
}

/** 영상 상세의 분석 결과 묶음(SPEC-031). 요약이 READY일 때만 이벤트·위험·스냅샷을 묻는다(R-1). */
export function AnalysisResults({ sourceId, controller }: AnalysisResultsProps) {
  const { data: summary, isPending, error } = useSourceSummary(sourceId);
  if (isPending) {
    return <p className="text-sm text-muted">분석 결과를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return null;
  }
  if (summary.status === "NOT_ANALYZED") {
    return (
      <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
        {ANALYSIS_NOT_ANALYZED_MESSAGE}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <SummaryPanel summary={summary} controller={controller} />
      <Panel title="이벤트">{null}</Panel>
      <Panel title="위험 상태">{null}</Panel>
      <Panel title="상태 스냅샷">{null}</Panel>
    </div>
  );
}
