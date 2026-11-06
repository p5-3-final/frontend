import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ANALYSIS_API, notAnalyzedSummaryBody } from "../mocks/analysis";
import { SESSIONS_API, workSessionPageBody } from "../mocks/media";
import { sseServer } from "../mocks/notifications";

/**
 * 테스트용 API 서버. 테스트마다 server.use로 필요한 응답을 등록한다(앞에 둔 핸들러가 먼저 적용된다).
 * 아래 기본 응답은 모든 테스트에 깔린다. 기능을 확인하는 테스트는 자기 응답을 server.use로 앞에 둔다.
 * - 로그인한 화면은 모두 알림 연결을 연다(SPEC-031 R-12). 기본은 아무 메시지도 보내지 않는 알림 서버다.
 * - 영상 상세는 분석 요약을 묻는다(SPEC-031 R-1). 기본은 분석 결과가 없는 영상이다.
 * - 업로드 화면은 세션 고르기에 내 세션을 묻는다(SPEC-034 R-6). 기본은 세션이 없다.
 */
export const server = setupServer(
  ...sseServer().handlers,
  http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) =>
    HttpResponse.json(notAnalyzedSummaryBody(String(params.sourceId))),
  ),
  http.get(SESSIONS_API, () => HttpResponse.json(workSessionPageBody([]))),
);
