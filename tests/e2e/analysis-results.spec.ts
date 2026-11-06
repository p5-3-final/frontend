import { expect, test, type Page } from "@playwright/test";
import {
  eventDetailBody,
  eventSummaryBody,
  notAnalyzedSummaryBody,
  riskBody,
  riskForecastBody,
  sourceSummaryBody,
} from "../../mocks/analysis";
import { jobStatusBody, sourceCompletedBody } from "../../mocks/notifications";
import { useFakeApi } from "./fakeApi";
import { E2E_VIDEO_ID, useFakeAnalysis } from "./fakeAnalysis";
import { useFakeNotifications } from "./fakeNotifications";

const DETAIL = `/analysis/videos/${E2E_VIDEO_ID}`;
// SPEC-031 NFR-1
const RENDER_BUDGET_MS = 300;

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("[SPEC-031 R-1] [SPEC-031 R-4] [SPEC-031 R-5] 요약·목록·진행 막대 표시를 보고 이벤트를 눌러 그 장면과 상세를 연다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await page.goto(DETAIL);

  const summary = page.getByRole("region", { name: "분석 요약" });
  await expect(
    summary.getByText("A동 크레인 하부에서 안전모 미착용 작업자가 확인되었습니다."),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "이벤트 목록" }).getByRole("listitem")).toHaveCount(
    1,
  );
  const marker = page
    .getByRole("list", { name: "이벤트 표시" })
    .getByRole("button", { name: "보호구 미착용 01:35 보통" });
  await expect(marker).toBeAttached();

  await page.getByRole("list", { name: "이벤트 목록" }).getByRole("button").first().click();

  await expect(page).toHaveURL(new RegExp(`\\?event=${eventSummaryBody().eventId}$`));
  await expect(
    page.getByRole("region", { name: "이벤트 상세" }).getByText("안전관리자 확인 필요"),
  ).toBeVisible();
  const currentTime = await page
    .getByLabel("crane.webm 재생")
    .evaluate((video: HTMLVideoElement) => video.currentTime);
  expect(currentTime).toBeCloseTo(93, 0);
  await noHorizontalScroll(page);
});

test("[SPEC-031 R-8] [SPEC-031 R-9] 위험 패널에 활성 위험이 먼저, 해소 위험이 다음에 보이고 예측은 참고용이다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page, {
    risks: [
      riskBody({ forecast: riskForecastBody() }),
      riskBody({
        riskId: "0192f500-0000-5000-8000-000000000005",
        status: "resolved",
        zoneName: null,
        reason: "방호벽 미복구",
        resolvedAtMs: 80_000,
      }),
    ],
  });
  await page.goto(DETAIL);

  const panel = page.getByRole("region", { name: "위험 상태" });
  await expect(panel.getByRole("list", { name: "활성 위험" })).toBeVisible();
  await expect(panel.getByRole("list", { name: "해소된 위험" }).getByText("전체")).toBeVisible();
  await expect(panel.getByText("참고용")).toBeVisible();
  await expect(panel.getByText("10분 뒤 노출 확률 42%")).toBeVisible();
  await noHorizontalScroll(page);
});

test("[SPEC-031 R-15] [SPEC-031 R-16] 분석 중인 영상은 진행 알림으로 진행률을 보이고 완료 알림 뒤 결과를 다시 불러온다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  const notifications = await useFakeNotifications(page);
  const analysis = await useFakeAnalysis(page, { summary: notAnalyzedSummaryBody(E2E_VIDEO_ID) });
  await page.goto(DETAIL);
  await expect(page.getByText("아직 분석 결과가 없습니다.")).toBeVisible();
  await expect(page.getByText("진행 상태 확인 중")).toBeVisible();

  notifications.push(jobStatusBody(E2E_VIDEO_ID, { progressPercent: 40 }));
  await expect(page.getByRole("progressbar", { name: "분석 진행률" })).toHaveAttribute(
    "aria-valuenow",
    "40",
  );

  analysis.summary = sourceSummaryBody({ sourceId: E2E_VIDEO_ID });
  notifications.push(
    jobStatusBody(E2E_VIDEO_ID, { progressPercent: 100, status: "COMPLETED", terminal: true }),
    sourceCompletedBody(E2E_VIDEO_ID),
  );

  await expect(page.getByRole("region", { name: "분석 요약" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "분석 진행률" })).toHaveCount(0);
  // 다시 연결할 때 마지막으로 받은 이벤트 id를 보낸다(R-13).
  expect(notifications.lastEventIds.slice(1)).toContain("1");
});

test("[SPEC-031 NFR-1] 이벤트 500개 영상에서 목록과 진행 막대 표시를 응답 뒤 300ms 안에 그린다", async ({
  page,
}) => {
  const events = Array.from({ length: 500 }, (_, i) =>
    eventSummaryBody({
      eventId: `0192f300-0000-5000-8000-${String(i).padStart(12, "0")}`,
      startMs: i * 1100,
      seekMs: Math.max(0, i * 1100 - 2000),
      severity: (["low", "medium", "high"] as const)[i % 3],
    }),
  );
  const summary = sourceSummaryBody({
    timeline: events.map((event) => ({
      atMs: event.startMs,
      kind: "event",
      refId: event.eventId,
      eventType: event.eventType,
      zoneId: event.zoneId,
      severity: event.severity,
    })),
  });
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page, { summary, events, details: [eventDetailBody()] });
  // 영상 길이를 안 시각(표시를 그릴 수 있게 된 시각)과 목록·표시가 모두 그려진 시각을 브라우저 안에서 기록한다.
  await page.addInitScript(() => {
    document.addEventListener(
      "loadedmetadata",
      () => {
        Object.assign(window, { metadataAt: performance.now() });
      },
      true,
    );
    const observer = new MutationObserver(() => {
      const rows = document.querySelectorAll('[aria-label="이벤트 목록"] > li').length;
      const markers = document.querySelectorAll('[aria-label="이벤트 표시"] > li').length;
      if (rows >= 100 && markers > 0) {
        Object.assign(window, { renderedAt: performance.now() });
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto(DETAIL);

  await expect(page.getByRole("list", { name: "이벤트 목록" }).getByRole("listitem")).toHaveCount(
    100,
  );
  await expect(
    page.getByRole("list", { name: "이벤트 표시" }).getByRole("listitem").first(),
  ).toBeAttached();

  const timings = await page.evaluate(() => {
    const ends = (part: string) =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes(part))
        .map((entry) => (entry instanceof PerformanceResourceTiming ? entry.responseEnd : 0));
    return {
      eventsAt: Math.max(...ends("/events?")),
      summaryAt: Math.max(...ends("/summary")),
      metadataAt: "metadataAt" in window ? Number(window.metadataAt) : 0,
      renderedAt: "renderedAt" in window ? Number(window.renderedAt) : Number.POSITIVE_INFINITY,
    };
  });
  const firstResponse = Math.max(timings.eventsAt, timings.summaryAt, timings.metadataAt);
  expect(timings.renderedAt - firstResponse).toBeLessThan(RENDER_BUDGET_MS);
});
