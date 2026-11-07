// SPEC-031 analysis-service 공개 API 픽스처와 MSW 핸들러. 응답은 계약 예시를 생성 타입으로 옮긴 것이다.
// 계약이 바뀌면 생성 타입이 바뀌어 여기서 typecheck가 실패한다.
import { http, HttpResponse } from "msw";
import { z } from "zod";
import type { components, operations } from "../src/api/generated/analysis-service";
import { problem } from "./handlers";
import { inspectHandlers, type InspectFixture } from "./inspect";

type Schemas = components["schemas"];
export type EventSummaryBody = Schemas["EventSummary"];
export type EventPageBody =
  operations["listSourceEvents"]["responses"]["200"]["content"]["application/json"];
export type EventDetailBody = Omit<Schemas["EventDetail"], "analysis" | "event"> & {
  event: EventSummaryBody;
  analysis: Record<string, unknown>;
};
export type RiskBody = Omit<Schemas["Risk"], "forecast"> & {
  forecast: Record<string, unknown> | null;
};
export type SourceSummaryBody = Schemas["SourceSummary"] & {
  partial?: boolean;
  missingCounts?: Record<string, number>;
};

const reviewRequestSchema = z.object({
  reviewState: z.enum(["UNREVIEWED", "CONFIRMED", "DISMISSED"]),
  note: z.string().nullable().optional(),
}) satisfies z.ZodType<Schemas["ReviewEventRequest"]>;

export const ANALYSIS_API = "http://localhost:8080/api/v1/analysis";
export const ANALYSIS_SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
export const ANALYSIS_EVENT_ID = "0192f300-0000-5000-8000-000000000101";
export const ANALYSIS_JOB_ID = "0192f0d5-0000-7000-8000-000000000001";
const ZONE_ID = "0192f100-0000-7000-8000-0000000000f1";
const SIGNED = "http://localhost:8333/vlm-media/derived/frame.jpg?X-Amz-Signature=frame-sig";

/** 계약 EventSummary 예시 */
export function eventSummaryBody(overrides: Partial<EventSummaryBody> = {}): EventSummaryBody {
  return {
    eventId: ANALYSIS_EVENT_ID,
    sourceId: ANALYSIS_SOURCE_ID,
    eventType: "ppe_missing",
    startMs: 95000,
    endMs: 105000,
    seekMs: 93000,
    severity: "medium",
    verificationStatus: "confirmed",
    judgmentMethod: "rule+vlm",
    description: "크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.",
    zoneId: ZONE_ID,
    zoneName: "A동 크레인 하부",
    trackId: "0192f200-0000-5000-8000-000000000001",
    reviewRequired: false,
    reviewState: "UNREVIEWED",
    thumbnailUrl: SIGNED,
    mergedInto: null,
    origin: "candidate",
    ...overrides,
  };
}

/** 이벤트 한 쪽. `size`는 요청한 값을 그대로 둔다. */
export function eventPageBody(
  items: EventSummaryBody[] = [eventSummaryBody()],
  page = 0,
  size = 100,
  totalElements = items.length,
): EventPageBody {
  return {
    items,
    page: { page, size, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) },
  };
}

/** 계약 events/_vlm-analysis.schema.json 예시 */
export function vlmAnalysisBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    eventType: "ppe_missing",
    eventDetected: true,
    verificationStatus: "confirmed",
    description: "크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.",
    beforeState: null,
    afterState: "안전모 미착용 작업자 작업 중",
    riskDetected: true,
    riskType: "ppe_missing",
    riskReason: "안전모 미착용",
    solution: "작업을 멈추고 안전모를 지급한다.",
    severity: "medium",
    evidenceStart: 95.0,
    evidenceEnd: 100.0,
    ...overrides,
  };
}

/** 계약 EventDetail 예시 */
export function eventDetailBody(overrides: Partial<EventDetailBody> = {}): EventDetailBody {
  return {
    event: eventSummaryBody(),
    analysis: vlmAnalysisBody(),
    evidenceFrames: [{ ptsMs: 95000, url: SIGNED }],
    judgments: [
      {
        taskType: "event_judge",
        modelId: "gpt-6.1-terra",
        verificationStatus: "confirmed",
        eventDetected: true,
      },
    ],
    reviewReasons: [],
    detectorProfile: "detect-v1",
    versions: { taxonomy: "v2", analysis: ANALYSIS_JOB_ID },
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    ...overrides,
  };
}

/** 계약 events/_risk-forecast.schema.json 예시 */
export function riskForecastBody(): Record<string, unknown> {
  return {
    method: "rule",
    horizons: [
      { horizonSec: 600, exposureProbability: 0.42 },
      { horizonSec: 1800, exposureProbability: 0.71 },
    ],
    features: { active_seconds: 1200.0, zone_entries_per_minute: 0.8 },
  };
}

/** 계약 Risk 예시 */
export function riskBody(overrides: Partial<RiskBody> = {}): RiskBody {
  return {
    riskId: "0192f500-0000-5000-8000-000000000004",
    zoneId: ZONE_ID,
    zoneName: "A동 크레인 하부",
    riskType: "ppe_missing",
    status: "active",
    reason: "안전모 미착용",
    firstSeenMs: 100000,
    lastSeenMs: 100000,
    resolvedAtMs: null,
    relatedEventIds: [ANALYSIS_EVENT_ID],
    carriedOver: false,
    exposure: { activeSeconds: 25.0, exposureCount: 1, exposureSeconds: 20.0 },
    forecast: null,
    ...overrides,
  };
}

export function riskListBody(items: RiskBody[] = [riskBody()]) {
  return { jobId: ANALYSIS_JOB_ID, items };
}

/** 계약 Snapshot 예시 */
export function snapshotBody(overrides: Partial<Schemas["Snapshot"]> = {}): Schemas["Snapshot"] {
  return {
    snapshotId: "0192f500-0000-5000-8000-000000000003",
    zoneId: ZONE_ID,
    zoneName: "A동 크레인 하부",
    timestampMs: 100000,
    previousState: "방호벽 설치됨",
    currentState: "안전모 미착용 작업자 작업 중",
    relatedEventId: ANALYSIS_EVENT_ID,
    ...overrides,
  };
}

export function snapshotListBody(
  items: Schemas["Snapshot"][] = [snapshotBody()],
): Schemas["SnapshotList"] {
  return { jobId: ANALYSIS_JOB_ID, items };
}

/** 계약 SourceSummary 예시(READY) */
export function sourceSummaryBody(overrides: Partial<SourceSummaryBody> = {}): SourceSummaryBody {
  return {
    sourceId: ANALYSIS_SOURCE_ID,
    status: "READY",
    jobId: ANALYSIS_JOB_ID,
    summary: {
      status: "generated",
      text: "A동 크레인 하부에서 안전모 미착용 작업자가 확인되었습니다.",
      highlights: [{ atMs: 95000, text: "안전모 미착용" }],
    },
    counts: { events: 3, confirmedEvents: 2, activeRisks: 1, resolvedRisks: 0 },
    unsupportedEvents: { barrier_not_restored: "구역 정의 없음" },
    session: null,
    timeline: [
      {
        atMs: 95000,
        kind: "event",
        refId: ANALYSIS_EVENT_ID,
        eventType: "ppe_missing",
        zoneId: ZONE_ID,
        severity: "medium",
      },
    ],
    analyzedAt: "2026-11-06T10:00:00Z",
    ...overrides,
  };
}

/** 분석 버전이 없는 영상의 요약 */
export function notAnalyzedSummaryBody(sourceId = ANALYSIS_SOURCE_ID): SourceSummaryBody {
  return {
    sourceId,
    status: "NOT_ANALYZED",
    jobId: null,
    summary: null,
    counts: {},
    unsupportedEvents: {},
    session: null,
    timeline: [],
    analyzedAt: null,
  };
}

export interface AnalysisFixture {
  summary?: SourceSummaryBody;
  events?: EventSummaryBody[];
  details?: EventDetailBody[];
  risks?: RiskBody[];
  snapshots?: Schemas["Snapshot"][];
  /** SPEC-032 오버레이·클릭 조회·구역 응답 */
  inspect?: InspectFixture;
}

/**
 * 분석 결과가 있는 영상 하나의 analysis API. 영상 ID는 요청 경로를 그대로 쓴다.
 * 이벤트 목록은 쿼리의 eventType·severity·verificationStatus·reviewState로 거르고 page·size로 나눈다.
 * 일부만 바꾸려면 `server.use(바꿀 핸들러, ...analysisHandlers())`처럼 앞에 둔다.
 */
export function analysisHandlers(fixture: AnalysisFixture = {}) {
  // 확인·기각(reviewEvent)이 바꾼 값을 다음 조회에도 보이게 핸들러 안에서 바꿔 쓴다.
  let events = fixture.events ?? [eventSummaryBody()];
  let details = fixture.details ?? [eventDetailBody()];
  const filterEvents = (url: URL) =>
    events.filter((event) =>
      (["eventType", "severity", "verificationStatus", "reviewState"] as const).every((key) => {
        const wanted = url.searchParams.get(key);
        return wanted === null || event[key] === wanted;
      }),
    );
  const pageOf = (url: URL, items: EventSummaryBody[]) => {
    const page = Number(url.searchParams.get("page") ?? "0");
    const size = Number(url.searchParams.get("size") ?? "20");
    return eventPageBody(items.slice(page * size, (page + 1) * size), page, size, items.length);
  };
  return [
    http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) =>
      HttpResponse.json(
        fixture.summary ?? sourceSummaryBody({ sourceId: String(params.sourceId) }),
      ),
    ),
    http.get(`${ANALYSIS_API}/sources/:sourceId/events`, ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(pageOf(url, filterEvents(url)));
    }),
    http.get(`${ANALYSIS_API}/sources/:sourceId/risks`, () =>
      HttpResponse.json(riskListBody(fixture.risks)),
    ),
    http.get(`${ANALYSIS_API}/sources/:sourceId/snapshots`, () =>
      HttpResponse.json(snapshotListBody(fixture.snapshots)),
    ),
    http.get(`${ANALYSIS_API}/events`, ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(pageOf(url, filterEvents(url)));
    }),
    http.put(`${ANALYSIS_API}/events/:eventId/review`, async ({ params, request }) => {
      const body = reviewRequestSchema.safeParse(await request.json());
      const detail = details.find((item) => item.event.eventId === params.eventId);
      if (detail === undefined) {
        return problem(404, "ANALYSIS_EVENT_NOT_FOUND");
      }
      if (!body.success) {
        return problem(400, "ANALYSIS_INVALID_REQUEST");
      }
      const event = { ...detail.event, reviewState: body.data.reviewState };
      const updated: EventDetailBody = {
        ...detail,
        event,
        reviewNote: body.data.note ?? null,
        reviewedBy: "0192f0c4-6d1e-7a3b-9c2d-1e2f3a4b5c6d",
        reviewedAt: "2026-11-06T11:00:00Z",
      };
      details = details.map((item) => (item.event.eventId === event.eventId ? updated : item));
      events = events.map((item) => (item.eventId === event.eventId ? event : item));
      return HttpResponse.json(updated);
    }),
    http.get(`${ANALYSIS_API}/events/:eventId`, ({ params }) => {
      const detail = details.find((item) => item.event.eventId === params.eventId);
      return detail === undefined
        ? problem(404, "ANALYSIS_EVENT_NOT_FOUND")
        : HttpResponse.json(detail);
    }),
    ...inspectHandlers(fixture.inspect),
  ];
}
