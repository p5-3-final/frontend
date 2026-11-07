// SPEC-033 search-service 공개 API 픽스처와 MSW 핸들러. 응답은 계약 예시를 생성 타입으로 옮긴 것이다.
// 계약이 바뀌면 생성 타입이 바뀌어 여기서 typecheck가 실패한다.
import { http, HttpResponse } from "msw";
import type { components } from "../src/api/generated/search-service";
import { ANALYSIS_SOURCE_ID } from "./analysis";
import type { NotificationBody } from "./notifications";

type Schemas = components["schemas"];
export type MomentResultBody = Schemas["MomentResult"];
export type MomentSearchResultBody = Schemas["MomentSearchResult"];
export type AnswerResultBody = Schemas["AnswerResult"];
export type GroundingClipBody = Schemas["GroundingClip"];
export type FeedbackRequestBody = Schemas["FeedbackRequest"];

export const SEARCH_API = "http://localhost:8080/api/v1/search";
export const SEARCH_SOURCE_ID = ANALYSIS_SOURCE_ID;
export const SEARCH_QUERY_ID = "0192f310-0000-7000-8000-000000000001";
export const SEARCH_MOMENT_ID = "0192f320-0000-5000-8000-000000000001";
export const SEARCH_GROUNDING_ID = "0192f300-0000-5000-8000-0000000000a1";
export const SEARCH_SEGMENT_ID = "0192f0e0-0000-5000-8000-000000000011";
const SIGNED_THUMBNAIL =
  "http://localhost:8333/vlm-media/derived/moment.jpg?X-Amz-Signature=thumb-sig";
export const SIGNED_CLIP_URL =
  "http://localhost:8333/vlm-media/derived/grounding.mp4?X-Amz-Signature=clip-sig";

/** n번째 결과 항목 ID. 계약 예시 ID의 끝자리만 바꾼다. */
export function momentId(index: number): string {
  return `0192f320-0000-5000-8000-${String(index + 1).padStart(12, "0")}`;
}

/** 계약 MomentResult 예시 */
export function momentBody(overrides: Partial<MomentResultBody> = {}): MomentResultBody {
  return {
    momentId: SEARCH_MOMENT_ID,
    sourceId: SEARCH_SOURCE_ID,
    segmentId: SEARCH_SEGMENT_ID,
    startMs: 40000,
    endMs: 50000,
    seekMs: 38000,
    similarity: 0.31,
    matchedBy: ["visual", "text"],
    rerankScore: 0.82,
    thumbnailUrl: SIGNED_THUMBNAIL,
    relatedEventId: null,
    grounding: { groundingId: SEARCH_GROUNDING_ID, status: "REQUESTED" },
    ...overrides,
  };
}

/** 계약 MomentSearchResult 예시(영상 안 검색) */
export function momentSearchBody(
  overrides: Partial<MomentSearchResultBody> = {},
): MomentSearchResultBody {
  return {
    queryId: SEARCH_QUERY_ID,
    query: "안전모 안 쓴 작업자",
    canonicalQuery: "person without a hard hat",
    parseMethod: "industrial-rule",
    targets: ["person without a hard hat"],
    scope: "source",
    precise: true,
    embeddingModel: "open_clip:MobileCLIP2-S0:dfndr2b:mean-4",
    notFound: false,
    degraded: null,
    reused: false,
    results: [momentBody()],
    ...overrides,
  };
}

/** 결과 n개. 유사도는 내려가는 순서이고 상위 3개만 주석을 요청한 상태다. */
export function momentList(count: number, overrides: Partial<MomentResultBody> = {}) {
  return Array.from({ length: count }, (_, index) =>
    momentBody({
      momentId: momentId(index),
      startMs: 40000 + index * 10000,
      endMs: 50000 + index * 10000,
      seekMs: 38000 + index * 10000,
      similarity: Number((0.5 - index * 0.005).toFixed(3)),
      grounding: {
        groundingId: `0192f300-0000-5000-8000-${String(index + 1).padStart(12, "0")}`,
        status: index < 3 ? "REQUESTED" : "NONE",
      },
      ...overrides,
    }),
  );
}

/** 계약 AnswerResult 예시 */
export function answerBody(overrides: Partial<AnswerResultBody> = {}): AnswerResultBody {
  return {
    queryId: SEARCH_QUERY_ID,
    question: "방호벽은 언제 치워졌나요?",
    answer: "1분 10초쯤 통로 입구의 방호벽이 옮겨졌습니다.",
    status: "confirmed",
    evidence: [momentBody({ grounding: { groundingId: SEARCH_GROUNDING_ID, status: "NONE" } })],
    relatedEvents: [
      {
        eventId: "0192f300-0000-5000-8000-000000000101",
        eventType: "object_moved",
        startMs: 70000,
        seekMs: 68000,
        description: "통로 입구의 방호벽이 옮겨졌습니다.",
      },
    ],
    limitations: ["장면 외형 기준 근거"],
    degraded: null,
    ...overrides,
  };
}

/** 계약 GroundingClip 예시. 프레임 시각(ptsMs)은 원본 영상 기준이다. */
export function groundingClipBody(overrides: Partial<GroundingClipBody> = {}): GroundingClipBody {
  return {
    groundingId: SEARCH_GROUNDING_ID,
    segmentId: SEARCH_SEGMENT_ID,
    status: "READY",
    targets: ["person without a hard hat"],
    clipUrl: SIGNED_CLIP_URL,
    colors: { "person without a hard hat": "#3fa2c1" },
    frames: [{ ptsMs: 40000, counts: { "person without a hard hat": 1 } }],
    ...overrides,
  };
}

/** grounding.completed 알림 본문 */
export function groundingCompletedBody(
  groundingId: string = SEARCH_GROUNDING_ID,
  outcome: "READY" | "FAILED" = "READY",
  sourceId: string = SEARCH_SOURCE_ID,
): NotificationBody {
  return {
    type: "grounding.completed",
    sourceId,
    occurredAt: "2026-11-06T10:06:00Z",
    data: {
      requestId: "0192f300-0000-7000-8000-0000000000b1",
      groundingId,
      segmentId: SEARCH_SEGMENT_ID,
      outcome,
    },
  };
}

export interface SearchFixture {
  sourceSearch?: MomentSearchResultBody;
  allSearch?: MomentSearchResultBody;
  imageSearch?: MomentSearchResultBody;
  answer?: AnswerResultBody;
  clip?: GroundingClipBody;
}

/** 계약 예시로 응답하는 search-service. 기록(feedback)은 204로 받는다. */
export function searchHandlers(fixture: SearchFixture = {}) {
  return [
    http.get(`${SEARCH_API}/sources/:sourceId/moments`, ({ request }) => {
      const query = new URL(request.url).searchParams.get("q") ?? "";
      return HttpResponse.json(fixture.sourceSearch ?? momentSearchBody({ query }));
    }),
    http.get(`${SEARCH_API}/moments`, ({ request }) => {
      const query = new URL(request.url).searchParams.get("q") ?? "";
      return HttpResponse.json(
        fixture.allSearch ??
          momentSearchBody({
            query,
            scope: "all",
            precise: false,
            results: [momentBody({ rerankScore: null })],
          }),
      );
    }),
    http.post(`${SEARCH_API}/moments/by-image`, () =>
      HttpResponse.json(
        fixture.imageSearch ??
          momentSearchBody({
            query: "",
            canonicalQuery: "",
            parseMethod: "image",
            targets: [],
            precise: false,
            results: [
              momentBody({
                matchedBy: ["image"],
                rerankScore: null,
                grounding: { groundingId: SEARCH_GROUNDING_ID, status: "NONE" },
              }),
            ],
          }),
      ),
    ),
    http.get(`${SEARCH_API}/sources/:sourceId/answer`, () =>
      HttpResponse.json(fixture.answer ?? answerBody()),
    ),
    http.post(
      `${SEARCH_API}/moments/:momentId/feedback`,
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.get(`${SEARCH_API}/groundings/:groundingId`, ({ params }) =>
      HttpResponse.json(
        fixture.clip ?? groundingClipBody({ groundingId: String(params.groundingId) }),
      ),
    ),
  ];
}
