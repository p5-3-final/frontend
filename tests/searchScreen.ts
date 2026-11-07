import { http, HttpResponse } from "msw";
import { z } from "zod";
import { handlers, MEDIA_API, mediaHandlers, videoBody, videoPageBody } from "../mocks/handlers";
import {
  SEARCH_API,
  SEARCH_SOURCE_ID,
  searchHandlers,
  type FeedbackRequestBody,
  type SearchFixture,
} from "../mocks/search";
import { startSession } from "../src/shared/api/session";
import { recordRequests } from "./analysisDetail";
import { renderRoute } from "./render";
import { server } from "./server";

export const SEARCH_VIDEO_NAME = "crane.mp4";

/** 검색 화면 주소. 조건을 주면 URL 쿼리로 붙인다. */
export function searchPath(params: Record<string, string> = {}) {
  const search = new URLSearchParams(params).toString();
  return search === "" ? "/search" : `/search?${search}`;
}

/**
 * 검색 화면을 연다. 내 영상은 분석이 끝난 crane.mp4(READY)와 아직 처리 중인 영상 하나다.
 * `extra`는 기본 응답보다 앞에 둔다. 돌려주는 `requests`로 보낸 요청을 확인한다.
 */
export function renderSearch(
  path = searchPath(),
  options: { extra?: Parameters<typeof server.use>; fixture?: SearchFixture } = {},
) {
  const recorder = recordRequests();
  server.use(
    ...(options.extra ?? []),
    handlers.me(),
    ...searchHandlers(options.fixture),
    http.get(MEDIA_API, () =>
      HttpResponse.json(
        videoPageBody([
          videoBody({ id: SEARCH_SOURCE_ID, fileName: SEARCH_VIDEO_NAME, status: "READY" }),
          videoBody({
            id: "0192f0d2-0000-7000-8000-000000000002",
            fileName: "processing.mp4",
            status: "NORMALIZING",
          }),
        ]),
      ),
    ),
    http.get(`${MEDIA_API}/:id`, ({ params }) =>
      HttpResponse.json(
        videoBody({
          id: String(params.id),
          fileName: params.id === SEARCH_SOURCE_ID ? SEARCH_VIDEO_NAME : "other.mp4",
          status: "READY",
        }),
      ),
    ),
    ...mediaHandlers(),
  );
  startSession("access-1");
  const view = renderRoute(path);
  return { ...view, requests: recorder.requests, stopRecording: recorder.stop };
}

/** 기록한 요청 중 search-service로 간 것만 경로+쿼리로 돌려준다. */
export function searchRequests(requests: readonly URL[]) {
  return requests
    .filter((url) => url.pathname.startsWith("/api/v1/search"))
    .map((url) => `${url.pathname}${url.search}`);
}

/** search-service로 보낸 기록(sendMomentFeedback)을 모은다. 핸들러는 renderSearch의 extra로 넘긴다. */
export function feedbackRecorder() {
  const sent: { momentId: string; kind: string; playedMs: number | null | undefined }[] = [];
  const handler = http.post(
    `${SEARCH_API}/moments/:momentId/feedback`,
    async ({ request, params }) => {
      const body = feedbackSchema.parse(await request.json());
      sent.push({ momentId: String(params.momentId), kind: body.kind, playedMs: body.playedMs });
      return new HttpResponse(null, { status: 204 });
    },
  );
  return { sent, handler };
}

const feedbackSchema = z.object({
  kind: z.enum(["jumped", "played", "correct", "incorrect"]),
  playedMs: z.number().nullable().optional(),
}) satisfies z.ZodType<FeedbackRequestBody>;
