/** 분석 이력(작업 세션 목록) 주소 */
export const HISTORY_PATH = "/history";

/** 작업 세션 상세 주소(SPEC-034 R-3) */
export function sessionDetailPath(sessionId: string): string {
  return `${HISTORY_PATH}/sessions/${sessionId}`;
}

/** 업로드 화면에서 처음 고를 세션의 쿼리 이름(SPEC-034 R-8) */
export const UPLOAD_SESSION_PARAM = "sessionId";

/** 그 세션이 골라진 업로드 화면 주소(SPEC-034 R-8) */
export function uploadToSessionPath(sessionId: string): string {
  return `/analysis?${new URLSearchParams({ [UPLOAD_SESSION_PARAM]: sessionId }).toString()}`;
}
