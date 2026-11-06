/** 분석 이력(작업 세션 목록) 주소 */
export const HISTORY_PATH = "/history";

/** 작업 세션 상세 주소(SPEC-034 R-3) */
export function sessionDetailPath(sessionId: string): string {
  return `${HISTORY_PATH}/sessions/${sessionId}`;
}
