import { http, HttpResponse } from "msw";
import {
  ANALYSIS_API,
  analysisHandlers,
  notAnalyzedSummaryBody,
  sourceSummaryBody,
  type AnalysisFixture,
} from "../mocks/analysis";
import { handlers, mediaHandlers } from "../mocks/handlers";
import {
  AFTER_VIDEO_ID,
  BEFORE_VIDEO_ID,
  sessionHandlers,
  WORK_SESSION_ID,
  type SessionFixture,
} from "../mocks/media";
import { startSession } from "../src/shared/api/session";
import { renderRoute } from "./render";
import { server } from "./server";

export const SESSION_DETAIL_PATH = `/history/sessions/${WORK_SESSION_ID}`;

/** 작업 전 영상은 분석됨(확정 이벤트 2, 활성 위험 1), 작업 후 영상은 분석 전인 요약 */
export const summaryBySource = http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) =>
  HttpResponse.json(
    params.sourceId === AFTER_VIDEO_ID
      ? notAnalyzedSummaryBody(AFTER_VIDEO_ID)
      : sourceSummaryBody({ sourceId: String(params.sourceId) }),
  ),
);

/**
 * 계약 예시 세션(작업 전 before.mp4, 작업 후 after.mp4)의 상세 화면을 연다. `extra`는 기본 응답보다 앞에 둔다.
 * analysis는 `summaryBySource`와 `analysisHandlers(analysis)`로 답한다.
 */
export function renderSessionDetail(
  extra: Parameters<typeof server.use> = [],
  options: { session?: SessionFixture; analysis?: AnalysisFixture; path?: string } = {},
) {
  server.use(
    ...extra,
    handlers.me(),
    summaryBySource,
    ...analysisHandlers(options.analysis),
    ...sessionHandlers(options.session),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return renderRoute(options.path ?? SESSION_DETAIL_PATH);
}

export { AFTER_VIDEO_ID, BEFORE_VIDEO_ID };
