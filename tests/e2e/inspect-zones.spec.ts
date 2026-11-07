import { expect, test, type Page } from "@playwright/test";
import { INSPECT_REQUEST_ID, INSPECT_TRACK_ID, QUESTION_REQUEST_ID } from "../../mocks/inspect";
import { trackAnalyzedBody } from "../../mocks/notifications";
import { useFakeApi } from "./fakeApi";
import { E2E_VIDEO_ID, useFakeAnalysis } from "./fakeAnalysis";
import { useFakeInspect } from "./fakeInspect";
import { useFakeNotifications } from "./fakeNotifications";

const DETAIL = `/analysis/videos/${E2E_VIDEO_ID}`;
const PLAYER = "crane.webm 재생";
// NFR-1: 박스 50개를 그리는 한 프레임 처리 시간
const FRAME_BUDGET_MS = 16;
// NFR-2: 클릭 조회 응답 뒤 트랙 패널 표시까지
const PANEL_BUDGET_MS = 100;

/** 영상이 메타데이터를 읽을 때까지 기다리고, 멈춘 채 seconds로 옮긴다. */
async function pauseAt(page: Page, seconds: number) {
  const video = page.getByLabel(PLAYER);
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(1);
  await video.evaluate(async (element: HTMLVideoElement, at) => {
    element.pause();
    element.currentTime = at;
    await new Promise((resolve) => {
      element.addEventListener("seeked", resolve, { once: true });
    });
  }, seconds);
}

/** 표시 영역의 비율 지점을 누른다. 영상과 요소의 비율이 달라도 가운데 근처는 표시 영역 안이다. */
async function clickFrame(page: Page, x: number, y: number) {
  const layer = page.getByRole("button", { name: "누른 위치의 객체 조회" });
  await layer.scrollIntoViewIfNeeded();
  const box = await layer.boundingBox();
  if (box === null) {
    throw new Error("조회 층이 없다.");
  }
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
}

test("[SPEC-032 R-3] [SPEC-032 R-4] [SPEC-032 R-5] [SPEC-032 NFR-2] 멈춘 화면을 눌러 속성 분석 중을 보고 알림 뒤 속성을 본다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  const notifications = await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeInspect(page);
  await page.goto(DETAIL);
  await pauseAt(page, 41);

  // 패널이 처음 보인 시각을 페이지 안에서 잰다(Playwright 대기 간격을 빼려고).
  await page.evaluate(() => {
    // 리소스 시간 기록은 기본 250개까지만 쌓인다. dev 서버 모듈 요청으로 차 있으면 조회 요청이 기록되지 않으므로 클릭 전에 비운다.
    performance.clearResourceTimings();
    const observer = new MutationObserver(() => {
      // 같은 화면에 다른 패널(SPEC-033 영상 질문 등)이 있으므로 첫 section이 아니라 제목으로 찾는다.
      const headings = document.querySelectorAll("section[aria-labelledby] h2");
      if ([...headings].some((heading) => heading.textContent === "트랙 정보")) {
        Reflect.set(window, "__panelShownAt", performance.now());
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await clickFrame(page, 0.5, 0.5);

  const panel = page.getByRole("region", { name: "트랙 정보" });
  await expect(panel.getByText("속성 분석 중")).toBeVisible();
  const elapsed = await page.evaluate(() => {
    const shown = Number(Reflect.get(window, "__panelShownAt"));
    const response = performance
      .getEntriesByType("resource")
      .find(
        (entry): entry is PerformanceResourceTiming =>
          entry instanceof PerformanceResourceTiming && entry.name.includes("/inspect?"),
      );
    return response === undefined ? Number.NaN : shown - response.responseEnd;
  });
  expect(elapsed).toBeLessThanOrEqual(PANEL_BUDGET_MS);

  notifications.push(
    trackAnalyzedBody(E2E_VIDEO_ID, {
      requestId: INSPECT_REQUEST_ID,
      trackId: INSPECT_TRACK_ID,
      reason: "click",
    }),
  );
  await expect(panel.getByRole("group", { name: "안전모" })).toContainText("미착용");
  await expect(panel.getByRole("group", { name: "보호구 상태" })).toContainText("미착용 확정");
});

test("[SPEC-032 R-7] [SPEC-032 R-8] 트랙에 질문하고 알림 뒤 답을 본다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  const notifications = await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeInspect(page);
  await page.goto(DETAIL);
  await pauseAt(page, 41);
  await clickFrame(page, 0.5, 0.5);
  const panel = page.getByRole("region", { name: "트랙 정보" });

  await panel.getByLabel("객체에 질문").fill("이 사람이 들고 있는 것은 무엇인가요?");
  await panel.getByRole("button", { name: "질문 보내기" }).click();
  await expect(panel.getByText("답을 기다리는 중")).toBeVisible();
  notifications.push(
    trackAnalyzedBody(E2E_VIDEO_ID, {
      requestId: QUESTION_REQUEST_ID,
      trackId: INSPECT_TRACK_ID,
      reason: "question",
    }),
  );

  await expect(panel.getByText("철근 묶음을 들고 있습니다.")).toBeVisible();
});

test("[SPEC-032 R-10] [SPEC-032 R-11] [SPEC-032 R-12] [SPEC-032 R-13] 구역을 그려 저장하고 재분석 안내를 본다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeInspect(page);
  await page.goto(DETAIL);
  await pauseAt(page, 41);

  await page.getByRole("button", { name: "위험구역 편집" }).click();
  const editor = page.getByRole("region", { name: "위험구역 편집" });
  await editor.getByRole("button", { name: "새 구역" }).click();
  await editor.getByLabel("구역 이름").fill("C동 하역장");
  const surface = page.getByRole("button", { name: "누른 위치에 꼭짓점 추가" });
  // 이름 칸에 입력하면 패널 쪽으로 스크롤되므로 그리기 층을 다시 화면에 둔다.
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  if (box === null) {
    throw new Error("구역 그리기 층이 없다.");
  }
  for (const [x, y] of [
    [0.55, 0.1],
    [0.8, 0.1],
    [0.8, 0.35],
    [0.55, 0.35],
  ] as const) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  }
  await expect(
    page.getByRole("group", { name: "구역 그리기" }).getByRole("button", { name: /^꼭짓점 \d+$/ }),
  ).toHaveCount(4);
  await editor.getByRole("button", { name: "구역 저장" }).click();

  await expect(
    editor.getByText("구역을 저장했습니다. 다음 분석부터 반영됩니다(재분석 필요)."),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "분석 요약" }).getByText("구역이 바뀌어 재분석이 필요합니다."),
  ).toBeVisible();
});

test("[SPEC-032 R-1] [SPEC-032 NFR-1] 박스 50개 오버레이를 켜고 재생해도 한 프레임 그리기가 16ms 안이다", async ({
  page,
}) => {
  const tracks = (fromMs: number) =>
    Array.from({ length: 50 }, (_, index) => ({
      trackId: `0192f200-0000-5000-8000-${String(index).padStart(12, "0")}`,
      className: index % 5 === 0 ? "forklift" : "person",
      hasEvent: index % 7 === 0,
      boxes: Array.from({ length: 20 }, (_, step) => ({
        ptsMs: fromMs + step * 500,
        box: { x: (index % 10) * 0.09, y: Math.floor(index / 10) * 0.18, w: 0.08, h: 0.15 },
      })),
    }));
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  await useFakeInspect(page, { overlayTracks: (fromMs) => tracks(fromMs) });
  await page.goto(DETAIL);
  await pauseAt(page, 40);

  await page.getByRole("button", { name: "오버레이" }).click();
  await expect(page.getByRole("img", { name: "객체 박스 50개" })).toBeVisible();
  await page.evaluate(() => {
    performance.clearMeasures("overlay-draw");
  });
  await page.getByLabel(PLAYER).evaluate(async (element: HTMLVideoElement) => {
    element.muted = true;
    await element.play();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    element.pause();
  });

  const durations = await page.evaluate(() =>
    performance.getEntriesByName("overlay-draw").map((entry) => entry.duration),
  );
  expect(durations.length).toBeGreaterThan(10);
  expect(Math.max(...durations)).toBeLessThanOrEqual(FRAME_BUDGET_MS);
});
