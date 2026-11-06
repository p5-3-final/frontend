import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page, Route } from "@playwright/test";
import {
  eventDetailBody,
  eventSummaryBody,
  riskBody,
  snapshotBody,
  sourceSummaryBody,
  type EventDetailBody,
  type EventSummaryBody,
  type RiskBody,
  type SourceSummaryBody,
} from "../../mocks/analysis";

const API = "http://localhost:8080/api/v1";
const STORAGE = "http://localhost:8333/vlm-media";
// Chromium이 재생할 수 있는 10분짜리 회색 화면(VP8). 진행 막대 표시는 영상 길이를 알아야 그려진다.
const VIDEO = readFileSync(resolve(import.meta.dirname, "fixtures/tiny-600s.webm"));

export const E2E_VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

export interface FakeAnalysisState {
  summary: SourceSummaryBody;
  events: EventSummaryBody[];
  details: EventDetailBody[];
  risks: RiskBody[];
}

function pageOf<T>(items: T[], url: URL) {
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
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

/**
 * E2E용 가짜 영상 하나(READY, crane.webm)와 analysis API. `state`를 바꾸면 다음 요청부터 그 값으로 답한다.
 * 실제 analysis-api와의 연결은 담당자 구현 뒤 다시 확인한다(plan 6절).
 */
export async function useFakeAnalysis(page: Page, initial: Partial<FakeAnalysisState> = {}) {
  const state: FakeAnalysisState = {
    summary: initial.summary ?? sourceSummaryBody(),
    events: initial.events ?? [eventSummaryBody()],
    details: initial.details ?? [eventDetailBody()],
    risks: initial.risks ?? [riskBody()],
  };

  // 실제 저장소(S3)처럼 Range 요청에 206으로 답한다. 범위를 지원하지 않으면 브라우저가 재생 위치를 옮기지 못한다.
  await page.route(`${STORAGE}/**`, async (route) => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "video/webm",
      "Accept-Ranges": "bytes",
    };
    const range = /bytes=(\d+)-(\d*)/.exec((await route.request().headerValue("range")) ?? "");
    if (range === null) {
      await route.fulfill({ status: 200, headers, body: VIDEO });
      return;
    }
    const start = Number(range[1]);
    const end = range[2] === "" || range[2] === undefined ? VIDEO.length - 1 : Number(range[2]);
    await route.fulfill({
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${String(start)}-${String(end)}/${String(VIDEO.length)}`,
      },
      body: VIDEO.subarray(start, end + 1),
    });
  });

  await page.route(`${API}/media/videos/**`, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/playback")) {
      await route.fulfill({
        json: {
          url: `${STORAGE}/sources/${E2E_VIDEO_ID}/original?X-Amz-Signature=play`,
          downloadUrl: `${STORAGE}/sources/${E2E_VIDEO_ID}/original?X-Amz-Signature=download`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      });
      return;
    }
    await route.fulfill({
      json: {
        id: E2E_VIDEO_ID,
        ownerId: "00000000-0000-4000-8000-000000000001",
        fileName: "crane.webm",
        sizeBytes: VIDEO.length,
        contentType: "video/mp4",
        status: "READY",
        createdAt: "2026-11-06T09:00:00Z",
        uploadedAt: "2026-11-06T09:01:00Z",
        session: null,
        retentionConsent: false,
      },
    });
  });

  await page.route(`${API}/analysis/**`, async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1/analysis", "");
    if (path.endsWith("/summary")) {
      await route.fulfill({ json: state.summary });
      return;
    }
    if (path.endsWith("/risks")) {
      await route.fulfill({ json: { jobId: state.summary.jobId, items: state.risks } });
      return;
    }
    if (path.endsWith("/snapshots")) {
      await route.fulfill({ json: { jobId: state.summary.jobId, items: [snapshotBody()] } });
      return;
    }
    if (path.endsWith("/events")) {
      const wanted = url.searchParams.get("verificationStatus");
      const items =
        wanted === null
          ? state.events
          : state.events.filter((e) => e.verificationStatus === wanted);
      await route.fulfill({ json: pageOf(items, url) });
      return;
    }
    const eventId = path.split("/").at(-1);
    const detail = state.details.find((item) => item.event.eventId === eventId);
    await route.fulfill(
      detail === undefined
        ? {
            status: 404,
            contentType: "application/problem+json",
            body: JSON.stringify({
              type: "about:blank",
              title: "Not Found",
              status: 404,
              code: "ANALYSIS_EVENT_NOT_FOUND",
            }),
          }
        : { json: detail },
    );
  });

  return state;
}
