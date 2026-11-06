import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName, SEVERITY_NAMES } from "../../../shared/lib/messages";
import type { TimelineMarker } from "../../player";
import { severitySchema, type SourceSummary } from "./schemas";

// 위험 시작·해소는 위험 패널이 보여 준다. 진행 막대에는 이벤트만 표시한다(R-4).
const EVENT_KINDS = new Set(["event", "rule_event", "inventory_event"]);

/**
 * 요약 응답의 `timeline`으로 진행 막대 표시를 만든다. 목록은 100건씩 나눠 받지만 표시는 요청 하나로 모두 그린다
 * (`timeline`이 모든 이벤트를 담는다는 계약 설명을 따른다).
 */
export function toTimelineMarkers(timeline: SourceSummary["timeline"]): TimelineMarker[] {
  return timeline
    .filter((item) => EVENT_KINDS.has(item.kind))
    .map((item) => {
      const severity = severitySchema.safeParse(item.severity);
      const parts = [eventTypeName(item.eventType ?? "other"), formatMediaTime(item.atMs)];
      if (severity.success) {
        parts.push(SEVERITY_NAMES[severity.data]);
      }
      return {
        id: item.refId,
        atMs: item.atMs,
        label: parts.join(" "),
        tone: severity.success ? severity.data : "none",
      };
    });
}
