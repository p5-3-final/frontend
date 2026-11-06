import type { PlayerController } from "../../player";
import { Panel } from "../../../shared/ui/Panel";
import { ANALYSIS_NOT_ANALYZED_MESSAGE } from "../../../shared/lib/messages";
import { useSourceSummary } from "../api/useSourceSummary";
import { useEventSelection } from "../hooks/useEventSelection";
import { AnalysisError } from "./AnalysisError";
import { EventDetailPanel } from "./EventDetailPanel";
import { EventsPanel } from "./EventsPanel";
import { RiskPanel } from "./RiskPanel";
import { SummaryPanel } from "./SummaryPanel";

export interface AnalysisResultsProps {
  sourceId: string;
  controller: PlayerController;
}

/** 영상 상세의 분석 결과 묶음(SPEC-031). 요약이 READY일 때만 이벤트·위험·스냅샷을 묻는다(R-1). */
export function AnalysisResults({ sourceId, controller }: AnalysisResultsProps) {
  const { data: summary, isPending, error, refetch } = useSourceSummary(sourceId);
  const selection = useEventSelection(controller);
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
      <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
        {ANALYSIS_NOT_ANALYZED_MESSAGE}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
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
          />
        )}
      </div>
      <RiskPanel sourceId={sourceId} controller={controller} />
      <Panel title="상태 스냅샷">{null}</Panel>
    </div>
  );
}
