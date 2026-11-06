import { http, HttpResponse } from "msw";
import { ANALYSIS_SOURCE_ID } from "../mocks/analysis";
import { handlers, MEDIA_API, mediaHandlers, videoBody } from "../mocks/handlers";
import type { components } from "../src/api/generated/auth-service";
import { startSession } from "../src/shared/api/session";
import { renderRoute } from "./render";
import { server } from "./server";

export const ANALYSIS_DETAIL_PATH = `/analysis/videos/${ANALYSIS_SOURCE_ID}`;

/** 요청 경로와 쿼리를 기록한다. 테스트가 끝나면 `stop`으로 기록을 멈춘다. */
export function recordRequests() {
  const requests: URL[] = [];
  const listener = ({ request }: { request: Request }) => {
    requests.push(new URL(request.url));
  };
  server.events.on("request:start", listener);
  return {
    requests,
    stop: () => {
      server.events.removeListener("request:start", listener);
    },
  };
}

/**
 * 분석이 끝난 영상(READY, crane.mp4)의 상세 화면을 연다. `extra`는 기본 media 응답보다 앞에 둔다.
 * 분석 응답은 `analysisHandlers()`를 넘긴다.
 */
export function renderAnalysisDetail(
  extra: Parameters<typeof server.use> = [],
  options: { path?: string; roles?: components["schemas"]["UserResponse"]["roles"] } = {},
) {
  server.use(
    ...extra,
    handlers.me({
      id: "27e8fd1d-d3ae-42f2-bb55-ff6f9c8661dc",
      email: "user@example.com",
      nickname: "테스터",
      roles: options.roles ?? ["USER"],
    }),
    http.get(`${MEDIA_API}/:id`, () =>
      HttpResponse.json(
        videoBody({ id: ANALYSIS_SOURCE_ID, fileName: "crane.mp4", status: "READY" }),
      ),
    ),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return renderRoute(options.path ?? ANALYSIS_DETAIL_PATH);
}
