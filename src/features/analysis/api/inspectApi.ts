import { apiRequest } from "../../../shared/api/client";
import {
  askAcceptedSchema,
  inspectResultSchema,
  overlaySchema,
  questionResultSchema,
  trackSchema,
  zoneListSchema,
  type ZoneDefinition,
} from "../model/inspectSchemas";

// 계약 analysis-service.yaml 0.4.0 공개 API(SPEC-032). api-gateway가 접근 토큰을 검증한다.
const ANALYSIS = "/api/v1/analysis";

/** [fromMs, toMs) 구간의 트랙 박스(operationId getSourceOverlay). 구간은 최대 10초다. */
export function getSourceOverlay(sourceId: string, fromMs: number, toMs: number) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/overlay`, overlaySchema, {
    query: { fromMs, toMs },
  });
}

/** 화면 클릭 조회(operationId inspectPoint). x·y는 프레임 크기로 나눈 0~1 좌표다. */
export function inspectPoint(sourceId: string, point: { tMs: number; x: number; y: number }) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/inspect`, inspectResultSchema, {
    query: point,
  });
}

/** 트랙과 속성(operationId getTrack) */
export function getTrack(trackId: string) {
  return apiRequest(`${ANALYSIS}/tracks/${trackId}`, trackSchema);
}

/** 객체 자유 질문(operationId askTrack). 답은 SSE track.analyzed(question) 뒤 {@link getTrackQuestion}으로 읽는다. */
export function askTrack(trackId: string, request: { question: string; tMs: number }) {
  return apiRequest(`${ANALYSIS}/tracks/${trackId}/ask`, askAcceptedSchema, {
    method: "POST",
    body: request,
  });
}

/** 객체 질문 결과(operationId getTrackQuestion) */
export function getTrackQuestion(trackId: string, requestId: string) {
  return apiRequest(`${ANALYSIS}/tracks/${trackId}/questions/${requestId}`, questionResultSchema);
}

/** 영상의 위험구역 정의(operationId getSourceZones) */
export function getSourceZones(sourceId: string) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/zones`, zoneListSchema);
}

/** 구역 목록 전체 바꾸기(operationId putSourceZones). 빠진 구역은 서버가 지운다. */
export function putSourceZones(sourceId: string, items: readonly ZoneDefinition[]) {
  return apiRequest(`${ANALYSIS}/sources/${sourceId}/zones`, zoneListSchema, {
    method: "PUT",
    body: { items },
  });
}
