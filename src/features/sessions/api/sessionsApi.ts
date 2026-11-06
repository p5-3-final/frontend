import { apiRequest } from "../../../shared/api/client";
import {
  workSessionDetailSchema,
  workSessionPageSchema,
  workSessionSchema,
  type CreateWorkSessionRequest,
} from "../model/schemas";

// 계약 media-service.yaml 작업 세션 API(SPEC-017). api-gateway를 거친다.
const SESSIONS = "/api/v1/media/sessions";

/** 화면 목록의 쪽 크기(SPEC-034 R-1) */
export const SESSION_PAGE_SIZE = 20;

/** 내 작업 세션 목록(operationId listWorkSessions). 서버가 만든 시각 최신순으로 준다. `page`는 0부터 센다. */
export function listWorkSessions(page: number, size = SESSION_PAGE_SIZE) {
  return apiRequest(SESSIONS, workSessionPageSchema, { query: { page, size } });
}

/** 작업 세션 상세(operationId getWorkSession) */
export function getWorkSession(sessionId: string) {
  return apiRequest(`${SESSIONS}/${sessionId}`, workSessionDetailSchema);
}

/** 작업 세션 만들기(operationId createWorkSession) */
export function createWorkSession(request: CreateWorkSessionRequest) {
  return apiRequest(SESSIONS, workSessionSchema, { method: "POST", body: request });
}
