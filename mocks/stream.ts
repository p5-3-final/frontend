// SPEC-031 v5.1 stream-service 세션 조회 픽스처와 MSW 핸들러(SPEC-036 계약 예시). 생성 타입으로 검사한다.
import { http, HttpResponse } from "msw";
import type { components, operations } from "../src/api/generated/stream-service";
import { problem } from "./handlers";

type Schemas = components["schemas"];
export type SessionBody = Schemas["Session"];
export type SessionStateBody = Schemas["SessionState"];
export type LiveEventBody = Schemas["LiveEvent"];
export type AlertBody = Schemas["Alert"];
export type LiveEventPageBody =
  operations["listSessionEvents"]["responses"]["200"]["content"]["application/json"];

export const STREAM_API = "http://localhost:8080/api/v1/stream";
export const STREAM_SESSION_ID = "0192fb00-0000-7000-8000-000000000010";
export const STREAM_CANDIDATE_ID = "0192fb00-0000-5000-8000-0000000000c1";
const SIGNED = "http://localhost:8333/vlm-media/derived/live.jpg?X-Amz-Signature=live-sig";

export function sessionBody(overrides: Partial<SessionBody> = {}): SessionBody {
  return {
    sessionId: STREAM_SESSION_ID,
    sourceId: STREAM_SESSION_ID,
    jobId: "0192fb00-0000-7000-8000-000000000030",
    cameraId: "0192fb00-0000-7000-8000-000000000020",
    status: "LIVE",
    previousSourceId: null,
    startedAt: "2026-11-06T10:00:00Z",
    closedAt: null,
    lastWindowSequence: 16,
    partialWindows: 0,
    ...overrides,
  };
}

export function playbackBody(): Schemas["Playback"] {
  return {
    mode: "live",
    hlsUrl: `http://localhost:8333/vlm-media/sources/${STREAM_SESSION_ID}/live/hls/index.m3u8?X-Amz-Signature=hls-sig`,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    windows: [],
  };
}

export function sessionStateBody(overrides: Partial<SessionStateBody> = {}): SessionStateBody {
  return {
    sequence: 16,
    asOfMs: 320000,
    zones: [
      { zoneId: "global", zoneName: null, currentState: "작업자 쓰러짐", updatedAtMs: 302800 },
    ],
    activeRisks: [
      {
        riskId: "0192fb00-0000-5000-8000-0000000000d1",
        zoneId: "global",
        riskType: "fall",
        reason: "쓰러진 작업자",
        firstSeenMs: 302800,
        lastSeenMs: 320000,
        activeSeconds: 17.2,
        exposureCount: 1,
        exposureSeconds: 17.2,
      },
    ],
    partialWindows: 0,
    gapMsTotal: 0,
    ...overrides,
  };
}

export function liveEventBody(overrides: Partial<LiveEventBody> = {}): LiveEventBody {
  return {
    eventId: STREAM_CANDIDATE_ID,
    chunkId: "0192fb00-0000-5000-8000-00000000000f",
    eventType: "fall",
    startMs: 302400,
    endMs: 302800,
    severity: "high",
    verificationStatus: "confirmed",
    judgmentMethod: "rule+vlm",
    unverifiedReason: null,
    trackId: "0192fb00-0000-5000-8000-0000000000a1",
    zoneId: null,
    description: "작업자 한 명이 바닥에 쓰러져 움직이지 않습니다.",
    evidenceFrameUrls: [SIGNED],
    ...overrides,
  };
}

export function alertBody(overrides: Partial<AlertBody> = {}): AlertBody {
  return {
    candidateId: STREAM_CANDIDATE_ID,
    status: "confirmed",
    eventType: "fall",
    reason: "severity_high",
    severity: "high",
    observedMs: 302800,
    pendingAt: "2026-11-06T10:05:04Z",
    decidedAt: "2026-11-06T10:05:08Z",
    dismissReason: null,
    description: "작업자 한 명이 바닥에 쓰러져 움직이지 않습니다.",
    evidenceFrameUrls: [SIGNED],
    ...overrides,
  };
}

function pageOf<T>(items: T[], url: URL) {
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "50");
  return {
    items: items.slice(page * size, (page + 1) * size),
    page: {
      page,
      size,
      totalElements: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
    },
  };
}

export interface StreamFixture {
  /** 요청마다 세션 상태를 정한다. 세션 종료 전환을 확인할 때 바꾼다. */
  session?: () => SessionBody;
  state?: () => SessionStateBody;
  events?: LiveEventBody[];
  alerts?: AlertBody[];
}

/** 세션 하나의 stream API. 세션이 CLOSED·FAILED면 라이브 조회는 계약대로 410을 준다. */
export function streamHandlers(fixture: StreamFixture = {}) {
  const session = fixture.session ?? (() => sessionBody());
  const archived = () => {
    const status = session().status;
    return status === "CLOSED" || status === "FAILED";
  };
  return [
    http.get(`${STREAM_API}/sessions/:sessionId`, () => HttpResponse.json(session())),
    http.get(`${STREAM_API}/sessions/:sessionId/playback`, () => HttpResponse.json(playbackBody())),
    http.get(`${STREAM_API}/sessions/:sessionId/state`, () =>
      archived()
        ? problem(410, "STREAM_SESSION_ARCHIVED")
        : HttpResponse.json(fixture.state?.() ?? sessionStateBody()),
    ),
    http.get(`${STREAM_API}/sessions/:sessionId/events`, ({ request }) =>
      archived()
        ? problem(410, "STREAM_SESSION_ARCHIVED")
        : HttpResponse.json(pageOf(fixture.events ?? [liveEventBody()], new URL(request.url))),
    ),
    http.get(`${STREAM_API}/sessions/:sessionId/alerts`, ({ request }) =>
      HttpResponse.json(pageOf(fixture.alerts ?? [alertBody()], new URL(request.url))),
    ),
  ];
}
