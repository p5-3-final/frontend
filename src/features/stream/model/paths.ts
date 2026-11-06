/** 실시간 세션 화면 주소(SPEC-031 R-19). sessionId는 sourceId와 같다. */
export function streamSessionPath(sessionId: string): string {
  return `/stream/sessions/${sessionId}`;
}
