// SPEC-034 media-service 작업 세션(SPEC-017)·학습용 보존(SPEC-018) 픽스처와 MSW 핸들러. 계약 예시를 생성 타입으로 옮긴 것이다.
// 계약이 바뀌면 생성 타입이 바뀌어 여기서 typecheck가 실패한다.
import { http, HttpResponse } from "msw";
import type { components } from "../src/api/generated/media-service";
import { problem, TEST_USER, videoBody } from "./handlers";

type Schemas = components["schemas"];
export type WorkSessionBody = Schemas["WorkSession"];
export type WorkSessionDetailBody = Schemas["WorkSessionDetail"];
export type VideoBody = Schemas["VideoResponse"];
export type RetainedVideoBody = Schemas["RetainedVideo"];

export const MEDIA_ROOT = "http://localhost:8080/api/v1/media";
export const SESSIONS_API = `${MEDIA_ROOT}/sessions`;
export const RETENTION_SETTINGS_API = `${MEDIA_ROOT}/retention-settings`;
export const RETAINED_VIDEOS_API = `${MEDIA_ROOT}/retained-videos`;
export const WORK_SESSION_ID = "0192f0e0-5a6b-7c8d-9e0f-1a2b3c4d5e6f";
export const BEFORE_VIDEO_ID = "0192f0e1-0000-7000-8000-000000000001";
export const AFTER_VIDEO_ID = "0192f0e1-0000-7000-8000-000000000002";

/** 계약 WorkSession 예시 */
export function workSessionBody(overrides: Partial<WorkSessionBody> = {}): WorkSessionBody {
  return {
    id: WORK_SESSION_ID,
    ownerId: TEST_USER.id,
    name: "3번 라인 방호벽 교체",
    site: "평택 공장",
    area: "3번 라인 프레스 앞",
    createdAt: "2026-11-06T09:00:00Z",
    ...overrides,
  };
}

/** 세션에 속한 영상. 계약 getWorkSession 예시의 before.mp4(READY)·after.mp4(UPLOADED) */
export function sessionVideoBody(
  role: Schemas["SessionRole"],
  overrides: Partial<VideoBody> = {},
): VideoBody {
  return videoBody({
    id: role === "BEFORE" ? BEFORE_VIDEO_ID : AFTER_VIDEO_ID,
    fileName: role === "BEFORE" ? "before.mp4" : "after.mp4",
    sizeBytes: 52428800,
    status: "READY",
    createdAt: "2026-11-06T09:20:00Z",
    uploadedAt: "2026-11-06T09:21:00Z",
    session: { sessionId: WORK_SESSION_ID, role },
    ...overrides,
  });
}

/** 계약 WorkSessionDetail 예시 */
export function workSessionDetailBody(
  overrides: Partial<WorkSessionDetailBody> = {},
): WorkSessionDetailBody {
  return {
    ...workSessionBody(),
    videos: [sessionVideoBody("BEFORE"), sessionVideoBody("AFTER", { status: "UPLOADED" })],
    ...overrides,
  };
}

function pageMeta(page: number, size: number, totalElements: number) {
  return { page, size, totalElements, totalPages: Math.ceil(totalElements / size) };
}

/** 계약 WorkSessionPage */
export function workSessionPageBody(
  items: WorkSessionBody[] = [workSessionBody()],
  page = 0,
  totalElements = items.length,
): Schemas["WorkSessionPage"] {
  return { items, page: pageMeta(page, 20, totalElements) };
}

/** 계약 RetainedVideo 예시 */
export function retainedVideoBody(overrides: Partial<RetainedVideoBody> = {}): RetainedVideoBody {
  return {
    videoId: "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
    deletedAt: "2026-11-06T09:00:00Z",
    retainUntil: "2027-11-06T09:00:00Z",
    ...overrides,
  };
}

/** 계약 RetainedVideoPage */
export function retainedVideoPageBody(
  items: RetainedVideoBody[] = [retainedVideoBody()],
  page = 0,
  totalElements = items.length,
): Schemas["RetainedVideoPage"] {
  return { items, page: pageMeta(page, 20, totalElements) };
}

export interface SessionFixture {
  sessions?: WorkSessionBody[];
  detail?: WorkSessionDetailBody;
}

/**
 * 작업 세션 API. 만든 세션은 핸들러 안 목록에 더해 다음 조회에도 보인다.
 * 없는 세션 ID의 상세는 계약대로 404 `MEDIA_SESSION_NOT_FOUND`다.
 */
export function sessionHandlers(fixture: SessionFixture = {}) {
  let sessions = fixture.sessions ?? [workSessionBody()];
  const detail = fixture.detail ?? workSessionDetailBody();
  let created = 0;
  return [
    http.get(SESSIONS_API, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "20");
      return HttpResponse.json({
        items: sessions.slice(page * size, (page + 1) * size),
        page: pageMeta(page, size, sessions.length),
      });
    }),
    http.post(SESSIONS_API, async ({ request }) => {
      const body: unknown = await request.json();
      const name =
        typeof body === "object" && body !== null && "name" in body ? String(body.name) : "";
      if (name.trim() === "" || name.length > 100) {
        return problem(400, "MEDIA_INVALID_REQUEST");
      }
      created++;
      const session = workSessionBody({
        id: `0192f0e0-0000-7000-8000-${String(created).padStart(12, "0")}`,
        name,
        site: null,
        area: null,
      });
      sessions = [session, ...sessions];
      return HttpResponse.json(session, { status: 201 });
    }),
    http.get(`${SESSIONS_API}/:sessionId`, ({ params }) => {
      if (params.sessionId === detail.id) {
        return HttpResponse.json(detail);
      }
      const found = sessions.find((session) => session.id === params.sessionId);
      return found === undefined
        ? problem(404, "MEDIA_SESSION_NOT_FOUND")
        : HttpResponse.json({ ...found, videos: [] });
    }),
  ];
}

export interface RetentionFixture {
  defaultConsent?: boolean;
  retained?: RetainedVideoBody[];
}

/** 학습용 보존 API. 바꾼 기본값과 철회한 영상은 다음 조회에도 반영된다. */
export function retentionHandlers(fixture: RetentionFixture = {}) {
  let defaultConsent = fixture.defaultConsent ?? false;
  let retained = fixture.retained ?? [retainedVideoBody()];
  return [
    http.get(RETENTION_SETTINGS_API, () => HttpResponse.json({ defaultConsent })),
    http.put(RETENTION_SETTINGS_API, async ({ request }) => {
      const body: unknown = await request.json();
      if (typeof body !== "object" || body === null || !("defaultConsent" in body)) {
        return problem(400, "MEDIA_INVALID_REQUEST");
      }
      defaultConsent = body.defaultConsent === true;
      return HttpResponse.json({ defaultConsent });
    }),
    http.get(RETAINED_VIDEOS_API, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "20");
      return HttpResponse.json({
        items: retained.slice(page * size, (page + 1) * size),
        page: pageMeta(page, size, retained.length),
      });
    }),
    http.delete(RETAINED_VIDEOS_API, () => {
      retained = [];
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${RETAINED_VIDEOS_API}/:videoId`, ({ params }) => {
      if (!retained.some((video) => video.videoId === params.videoId)) {
        return problem(404, "MEDIA_RETAINED_VIDEO_NOT_FOUND");
      }
      retained = retained.filter((video) => video.videoId !== params.videoId);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
