import type { EventSummary, Risk } from "../../analysis";
import type { Video } from "../../upload";

/**
 * 세션 흐름 요약에 넣는 이벤트 유형(SPEC-034 R-4). 작업 전후 비교로만 찾을 수 있는 변화다.
 * 방호 미복구는 규칙 이벤트, 물건 제거·이동은 재고 비교 이벤트다.
 */
export const FLOW_EVENT_TYPES: ReadonlySet<string> = new Set([
  "barrier_not_restored",
  "object_removed",
  "object_moved",
]);

interface FlowItemBase {
  id: string;
  video: Video;
  videoId: string;
  /** 영상 안 시각(ms). 이벤트는 startMs, 위험은 firstSeenMs다. */
  atMs: number;
}

export type FlowItem =
  | (FlowItemBase & { kind: "event"; event: EventSummary })
  | (FlowItemBase & { kind: "risk"; risk: Risk });

/** 영상 하나의 분석 결과. 아직 받지 못했으면 undefined다. */
export interface FlowSource {
  video: Video;
  events: readonly EventSummary[] | undefined;
  risks: readonly Risk[] | undefined;
}

/**
 * 흐름 요약 항목을 만든다. `sources`는 세션 안 영상 순서(역할 순, 같은 역할은 받은 순서)다.
 * 영상 순서를 먼저, 같은 영상 안에서는 시각 순으로 놓는다.
 */
export function buildSessionFlow(sources: readonly FlowSource[]): FlowItem[] {
  return sources.flatMap(({ video, events = [], risks = [] }) => {
    const base = { video, videoId: video.id };
    const items: FlowItem[] = [
      ...risks
        .filter((risk) => risk.carriedOver)
        .map((risk) => ({
          ...base,
          kind: "risk" as const,
          id: risk.riskId,
          atMs: risk.firstSeenMs,
          risk,
        })),
      ...events
        .filter(
          (event) =>
            event.verificationStatus === "confirmed" && FLOW_EVENT_TYPES.has(event.eventType),
        )
        .map((event) => ({
          ...base,
          kind: "event" as const,
          id: event.eventId,
          atMs: event.startMs,
          event,
        })),
    ];
    return items.sort((a, b) => a.atMs - b.atMs);
  });
}
