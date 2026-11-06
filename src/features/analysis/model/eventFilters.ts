import type { EventType, ReviewState, Severity, VerificationStatus } from "./schemas";

/** 영상 이벤트 목록 거르기(listSourceEvents 쿼리) */
export interface EventQuery {
  eventType?: EventType;
  severity?: Severity;
  verificationStatus?: VerificationStatus;
  reviewState?: ReviewState;
}

/** 전체 이벤트 목록 거르기(listMyEvents 쿼리). `from`·`to`는 ISO 시각이다. */
export interface MyEventQuery extends EventQuery {
  from?: string;
  to?: string;
}
