import { apiRequest } from "../../../shared/api/client";
import type { EventQuery, MyEventQuery } from "../model/eventFilters";
import {
  eventDetailSchema,
  eventPageSchema,
  riskListSchema,
  snapshotListSchema,
  sourceSummarySchema,
  type ReviewEventRequest,
} from "../model/schemas";

// 계약 analysis-service.yaml 공개 API. api-gateway가 접근 토큰을 검증하고 X-User-Id를 붙인다.
const ANALYSIS = "/api/v1/analysis";

/** 계약 Size 최대값. 이벤트 500개 영상은 다섯 쪽이다. */
export const SOURCE_EVENTS_PAGE_SIZE = 100;
export const MY_EVENTS_PAGE_SIZE = 20;

/** 영상 분석 요약(operationId getSourceSummary) */
export function getSourceSummary(sourceId: string) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/summary`, sourceSummarySchema);
}

/** 영상 이벤트 한 쪽(operationId listSourceEvents). 정렬은 서버의 startMs 순이다. */
export function listSourceEvents(sourceId: string, query: EventQuery, page: number) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/events`, eventPageSchema, {
    query: { ...query, page, size: SOURCE_EVENTS_PAGE_SIZE },
  });
}

/** 내 영상 전체 이벤트 한 쪽(operationId listMyEvents). 정렬은 저장 시각 내림차순이다. */
export function listMyEvents(query: MyEventQuery, page: number) {
  return apiRequest(`${ANALYSIS}/events`, eventPageSchema, {
    query: { ...query, page, size: MY_EVENTS_PAGE_SIZE },
  });
}

/** 이벤트 상세(operationId getEvent) */
export function getEvent(eventId: string) {
  return apiRequest(`${ANALYSIS}/events/${eventId}`, eventDetailSchema);
}

/** 이벤트 확인·기각(operationId reviewEvent). OPERATOR만 쓴다. */
export function reviewEvent(eventId: string, request: ReviewEventRequest) {
  return apiRequest(`${ANALYSIS}/events/${eventId}/review`, eventDetailSchema, {
    method: "PUT",
    body: request,
  });
}

/** 영상의 위험 상태(operationId listSourceRisks). 활성 먼저, 그다음 firstSeenMs 순이다. */
export function listSourceRisks(sourceId: string) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/risks`, riskListSchema);
}

/** 영상의 상태 스냅샷(operationId listSourceSnapshots). timestampMs 순이다. */
export function listSourceSnapshots(sourceId: string) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/snapshots`, snapshotListSchema);
}
