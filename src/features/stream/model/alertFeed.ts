import type { NotificationOf } from "../../notifications";

/** 화면에 보이는 긴급 알림 하나(candidateId마다 마지막 상태) */
export interface FeedAlert {
  candidateId: string;
  /** 세션 ID(= sourceId). 누르면 그 세션 화면으로 간다. */
  sourceId: string | null;
  status: "pending" | "confirmed" | "dismissed";
  eventType: string;
  severity: "low" | "medium" | "high";
  description: string | null;
}

export type AlertFeed = readonly FeedAlert[];

// 화면에 오래 쌓이지 않게 최근 것만 둔다.
const FEED_LIMIT = 5;

const isDecided = (status: FeedAlert["status"]) => status !== "pending";

/**
 * 긴급 알림 상태 전이(SPEC-031 R-20). 새 candidateId는 맨 앞에, 같은 candidateId는 그 자리에서 상태를 바꾼다.
 * 알림 순서가 뒤집혀 결정(confirmed·dismissed)이 먼저 오면 뒤의 pending은 버린다(plan 9절).
 */
export function applyAlert(feed: AlertFeed, message: NotificationOf<"alert.raised">): AlertFeed {
  const next: FeedAlert = {
    candidateId: message.data.candidateId,
    sourceId: message.sourceId,
    status: message.data.status,
    eventType: message.data.eventType,
    severity: message.data.severity,
    description: message.data.description ?? null,
  };
  const current = feed.find((item) => item.candidateId === next.candidateId);
  if (current === undefined) {
    return [next, ...feed].slice(0, FEED_LIMIT);
  }
  if (isDecided(current.status) && !isDecided(next.status)) {
    return feed;
  }
  return feed.map((item) => (item.candidateId === next.candidateId ? next : item));
}

/** 사용자가 닫은 알림을 뺀다. */
export function removeAlert(feed: AlertFeed, candidateId: string): AlertFeed {
  return feed.filter((item) => item.candidateId !== candidateId);
}
