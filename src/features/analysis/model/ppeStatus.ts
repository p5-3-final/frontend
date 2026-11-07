import type { EventQuery } from "./eventFilters";
import type { EventSummary } from "./schemas";

/** 트랙 패널 보호구 상태의 근거(SPEC-032 R-15) */
export type PpeStatus = { source: "event"; event: EventSummary } | { source: "attribute" };

/**
 * 트랙 패널이 보호구 확정 이벤트를 찾을 때 쓰는 목록 거르기. 계약 listSourceEvents에 trackId 거르기가 없어
 * 유형·판정으로 서버에서 줄이고 트랙은 화면에서 고른다.
 */
export const CONFIRMED_PPE_QUERY: EventQuery = {
  eventType: "ppe_missing",
  verificationStatus: "confirmed",
};

/**
 * 보호구 상태는 확정된 `ppe_missing` 이벤트를 우선한다(v5.1 17.2절). 이벤트 판정은 여러 프레임을 본 결과이고,
 * `track_attribute`는 크롭 한 장의 추정이라 보조로만 쓴다. 이벤트가 없으면 속성 값을 쓴다.
 */
export function ppeStatus(events: readonly EventSummary[], trackId: string): PpeStatus {
  const event = events.find(
    (item) =>
      item.trackId === trackId &&
      item.eventType === "ppe_missing" &&
      item.verificationStatus === "confirmed",
  );
  return event === undefined ? { source: "attribute" } : { source: "event", event };
}
