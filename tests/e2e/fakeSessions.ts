import type { Page, Route } from "@playwright/test";
import { eventSummaryBody, sourceSummaryBody } from "../../mocks/analysis";
import type { FakeVideo } from "./fakeMedia";

const API = "http://localhost:8080/api/v1";
const ROLE_ORDER = { BEFORE: 0, DURING: 1, AFTER: 2 } as const;
export const E2E_BARRIER_EVENT_ID = "0192f300-0000-5000-8000-000000000201";

interface FakeWorkSession {
  id: string;
  ownerId: string;
  name: string;
  site: string | null;
  area: string | null;
  createdAt: string;
}

function problem(status: number, code: string) {
  return {
    status,
    contentType: "application/problem+json",
    body: JSON.stringify({ type: "about:blank", title: "Error", status, code }),
  };
}

function pageOf<T>(items: T[], url: URL) {
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  return {
    items: items.slice(page * size, (page + 1) * size),
    page: { page, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) },
  };
}

export interface FakeSessionsOptions {
  /** 세션 상세 응답을 보낸 시각을 남긴다(NFR-2 측정). */
  onDetailSent?: () => void;
  /** 분석 요약 응답을 늦춘다(ms). 세션 상세가 요약을 기다리지 않는지 볼 때 쓴다. */
  summaryDelayMs?: number;
}

/**
 * E2E용 가짜 작업 세션·학습용 보존 API와 세션 영상의 analysis API(SPEC-034).
 * 세션 상세의 영상은 가짜 media가 만든 영상 중 그 세션에 넣은 것을 역할 순으로 준다.
 * analysis는 모든 영상을 분석됨으로 답하고, 작업 후 영상에만 확정 방호 미복구 이벤트를 둔다.
 */
export async function useFakeSessions(
  page: Page,
  media: { videos: FakeVideo[] },
  options: FakeSessionsOptions = {},
) {
  const sessions: FakeWorkSession[] = [];
  const retention = { defaultConsent: false };

  await page.route(`${API}/media/sessions**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const id = url.pathname.replace("/api/v1/media/sessions", "").replace(/^\//, "");
    if (request.method() === "GET" && id === "") {
      await route.fulfill({ json: pageOf([...sessions].reverse(), url) });
      return;
    }
    if (request.method() === "POST") {
      const body: unknown = request.postDataJSON();
      const input =
        typeof body === "object" && body !== null ? Object.fromEntries(Object.entries(body)) : {};
      const session: FakeWorkSession = {
        id: `00000000-0000-4000-9000-${String(sessions.length + 1).padStart(12, "0")}`,
        ownerId: "00000000-0000-4000-8000-000000000001",
        name: String(input.name),
        site: typeof input.site === "string" ? input.site : null,
        area: typeof input.area === "string" ? input.area : null,
        createdAt: "2026-11-07T09:00:00Z",
      };
      sessions.push(session);
      await route.fulfill({ status: 201, json: session });
      return;
    }
    const session = sessions.find((candidate) => candidate.id === id);
    if (session === undefined) {
      await route.fulfill(problem(404, "MEDIA_SESSION_NOT_FOUND"));
      return;
    }
    const videos = media.videos
      .filter((video) => video.session?.sessionId === id)
      .sort(
        (a, b) => ROLE_ORDER[a.session?.role ?? "AFTER"] - ROLE_ORDER[b.session?.role ?? "AFTER"],
      );
    await route.fulfill({ json: { ...session, videos } });
    options.onDetailSent?.();
  });

  await page.route(`${API}/media/retention-settings`, async (route: Route) => {
    if (route.request().method() === "PUT") {
      const body: unknown = route.request().postDataJSON();
      retention.defaultConsent =
        typeof body === "object" && body !== null && "defaultConsent" in body
          ? body.defaultConsent === true
          : false;
    }
    await route.fulfill({ json: retention });
  });

  await page.route(`${API}/media/retained-videos**`, async (route: Route) => {
    await route.fulfill({ json: pageOf([], new URL(route.request().url())) });
  });

  await page.route(`${API}/analysis/**`, async (route: Route) => {
    const url = new URL(route.request().url());
    const [, , sourceId, kind] = url.pathname.replace("/api/v1/analysis", "").split("/");
    const video = media.videos.find((candidate) => candidate.id === sourceId);
    if (kind === "summary") {
      if (options.summaryDelayMs !== undefined) {
        await new Promise((resolve) => setTimeout(resolve, options.summaryDelayMs));
      }
      await route.fulfill({ json: sourceSummaryBody({ sourceId: sourceId ?? "" }) });
      return;
    }
    if (kind === "events") {
      const events =
        video?.session?.role === "AFTER"
          ? [
              eventSummaryBody({
                eventId: E2E_BARRIER_EVENT_ID,
                sourceId: video.id,
                eventType: "barrier_not_restored",
                startMs: 65000,
                origin: "rule",
              }),
            ]
          : [];
      await route.fulfill({ json: pageOf(events, url) });
      return;
    }
    if (kind === "risks" || kind === "snapshots") {
      await route.fulfill({ json: { jobId: null, items: [] } });
      return;
    }
    await route.fulfill(problem(404, "ANALYSIS_EVENT_NOT_FOUND"));
  });

  return { sessions, retention };
}
