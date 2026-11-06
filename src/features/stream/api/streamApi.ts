import { apiRequest } from "../../../shared/api/client";
import {
  alertPageSchema,
  liveEventPageSchema,
  playbackSchema,
  sessionSchema,
  sessionStateSchema,
} from "../model/schemas";

// 계약 stream-service.yaml 1.0.0 세션 라이브 조회(SPEC-036). 세션이 끝나면 라이브 조회는 410 STREAM_SESSION_ARCHIVED다.
const SESSIONS = "/api/v1/stream/sessions";
// 계약 Size 최대값. 세션 화면은 최근 100건만 보이고, 끝나면 analysis 결과(전체)로 바꾼다.
const PAGE_SIZE = 100;

/** 세션 상세(operationId getSession) */
export function getSession(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}`, sessionSchema);
}

/** 라이브·과거 재생 주소(operationId getSessionPlayback). 서명 주소는 짧게 만료된다. */
export function getSessionPlayback(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}/playback`, playbackSchema);
}

/** 세션 현재 상태(operationId getSessionState) */
export function getSessionState(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}/state`, sessionStateSchema);
}

/** 세션 타임라인(operationId listSessionEvents). startMs 오름차순이다. */
export function listSessionEvents(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}/events`, liveEventPageSchema, {
    query: { page: 0, size: PAGE_SIZE },
  });
}

/** 세션 긴급 알림(operationId listSessionAlerts). 최근 것부터, candidateId마다 최신 상태 하나다. */
export function listSessionAlerts(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}/alerts`, alertPageSchema, {
    query: { page: 0, size: PAGE_SIZE },
  });
}
