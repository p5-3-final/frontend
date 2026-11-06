import type { TimelineMarker } from "../../player";
import { useSourceSummary } from "../api/useSourceSummary";
import { toTimelineMarkers } from "../model/timelineMarkers";

/** 진행 막대 위 이벤트 표시(SPEC-031 R-4). 요약 query를 결과 패널과 함께 쓴다. */
export function useTimelineMarkers(sourceId: string): TimelineMarker[] {
  const { data } = useSourceSummary(sourceId);
  return data === undefined ? [] : toTimelineMarkers(data.timeline);
}
