import { useHasRole } from "../../auth";
import type { PlayerController } from "../../player";
import { ANALYSIS_NOT_ANALYZED_MESSAGE } from "../../../shared/lib/messages";
import { useSourceSummary } from "../api/useSourceSummary";
import { useAnalysisLiveRefresh } from "../hooks/useAnalysisLiveRefresh";
import { useEventSelection } from "../hooks/useEventSelection";
import { AnalysisError } from "./AnalysisError";
import { AnalysisProgress } from "./AnalysisProgress";
import { EventDetailPanel } from "./EventDetailPanel";
import { EventReviewForm } from "./EventReviewForm";
import { EventsPanel } from "./EventsPanel";
import { RiskPanel } from "./RiskPanel";
import { SnapshotList } from "./SnapshotList";
import { SummaryPanel } from "./SummaryPanel";

export interface AnalysisResultsProps {
  sourceId: string;
  controller: PlayerController;
}

/** 영상 상세의 분석 결과 묶음(SPEC-031). 요약이 READY일 때만 이벤트·위험·스냅샷을 묻는다(R-1). */
export function AnalysisResults({ sourceId, controller }: AnalysisResultsProps) {
  const { data: summary, isPending, error, refetch } = useSourceSummary(sourceId);
  const selection = useEventSelection(controller);
  useAnalysisLiveRefresh(sourceId);
  // 버튼만 숨긴다. 권한은 서버가 403으로 다시 막는다.
  const isOperator = useHasRole("OPERATOR");
  if (isPending) {
    return <p className="text-sm text-muted">분석 결과를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return (
      <AnalysisError
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (summary.status === "NOT_ANALYZED") {
    return (
      <div className="flex flex-col gap-2">
        <AnalysisProgress key={sourceId} sourceId={sourceId} awaiting />
        <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          {ANALYSIS_NOT_ANALYZED_MESSAGE}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {/* 결과가 있는 영상도 재분석 중이면 진행 알림이 온다. 그때만 보인다. */}
      <AnalysisProgress key={sourceId} sourceId={sourceId} awaiting={false} />
      <SummaryPanel summary={summary} controller={controller} />
      {/* 1024px 이상은 목록과 상세를 두 칸으로, 그 미만은 쌓는다(plan 화면 배치). */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EventsPanel
          sourceId={sourceId}
          selectedId={selection.selectedId}
          onSelect={selection.select}
        />
        {selection.selectedId !== undefined && (
          <EventDetailPanel
            eventId={selection.selectedId}
            controller={controller}
            onClose={selection.close}
            footer={(detail) => (isOperator ? <EventReviewForm detail={detail} /> : null)}
          />
        )}
      </div>
      <RiskPanel sourceId={sourceId} controller={controller} />
      <SnapshotList sourceId={sourceId} onOpenEvent={selection.open} />
    </div>
  );
}
