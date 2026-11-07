import { expect, test, type Page } from "@playwright/test";
import {
  groundingCompletedBody,
  momentList,
  momentSearchBody,
  SEARCH_GROUNDING_ID,
} from "../../mocks/search";
import { useFakeApi } from "./fakeApi";
import { E2E_VIDEO_ID, useFakeAnalysis } from "./fakeAnalysis";
import { useFakeNotifications } from "./fakeNotifications";
import { thumbnailUrl, useFakeSearch } from "./fakeSearch";

const SEARCH = `/search?${new URLSearchParams({ q: "안전모 안 쓴 작업자", scope: "source", sourceId: E2E_VIDEO_ID }).toString()}`;
const DETAIL = `/analysis/videos/${E2E_VIDEO_ID}`;
// SPEC-033 NFR-1
const RENDER_BUDGET_MS = 200;

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("[SPEC-033 R-1] [SPEC-033 R-5] [SPEC-033 R-6] [SPEC-033 R-12] 문장 검색 → 주석 클립 READY → 클립 재생 → 결과에서 상세 이동", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  const notifications = await useFakeNotifications(page);
  await useFakeAnalysis(page);
  // 영상·재생은 useFakeAnalysis가 맡는다. 나중에 등록한 route가 먼저 적용되므로 검색을 뒤에 둔다.
  const state = await useFakeSearch(page, {
    sourceSearch: momentSearchBody({
      results: momentList(3).map((moment, index) => ({
        ...moment,
        thumbnailUrl: thumbnailUrl(index),
      })),
    }),
  });
  const firstGrounding =
    state.sourceSearch.results[0]?.grounding.groundingId ?? SEARCH_GROUNDING_ID;
  await page.goto(SEARCH);

  const results = page.getByRole("list", { name: "검색 결과" });
  await expect(results.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText("장면 외형 기준 검색입니다.")).toBeVisible();
  await expect(results.getByText("주석 클립 만드는 중")).toHaveCount(3);
  await noHorizontalScroll(page);

  notifications.push(groundingCompletedBody(firstGrounding, "READY", E2E_VIDEO_ID));
  await results.getByRole("button", { name: "주석 클립 보기" }).click();
  const dialog = page.getByRole("dialog", { name: "주석 클립" });
  await expect(dialog.getByLabel("주석 클립 재생")).toHaveAttribute("src", /grounding\.webm/);
  await expect(dialog.getByRole("list", { name: "대상어 색" })).toContainText(
    "person without a hard hat",
  );
  await noHorizontalScroll(page);
  await dialog.getByRole("button", { name: "닫기" }).click();

  await results.getByRole("link", { name: "00:40–00:50 장면 보기" }).click();
  await expect(page).toHaveURL(new RegExp(`${DETAIL}\\?t=38000$`));
  const video = page.getByLabel("crane.webm 재생");
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeCloseTo(38, 0);
  expect(state.feedback).toContain("jumped");

  await page.goBack();
  await expect(results.getByRole("listitem")).toHaveCount(3);
});

test("[SPEC-033 R-9] 영상에 질문하고 근거를 눌러 그 시각으로 간다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  // 영상·재생은 useFakeAnalysis가 맡는다. 나중에 등록한 route가 먼저 적용되므로 검색을 뒤에 둔다.
  await useFakeSearch(page);
  await page.goto(DETAIL);

  const panel = page.getByRole("region", { name: "영상에 질문" });
  await panel.getByRole("textbox", { name: "질문" }).fill("방호벽은 언제 치워졌나요?");
  await panel.getByRole("button", { name: "질문하기" }).click();

  await expect(panel.getByText("1분 10초쯤 통로 입구의 방호벽이 옮겨졌습니다.")).toBeVisible();
  const video = page.getByLabel("crane.webm 재생");
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThan(0);
  await panel.getByRole("button", { name: "근거 00:40–00:50로 이동" }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeCloseTo(38, 0);
  await noHorizontalScroll(page);
});

test("[SPEC-033 R-8] 이미지를 올리면 multipart로 범위와 함께 보내고 결과를 보인다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  // 영상·재생은 useFakeAnalysis가 맡는다. 나중에 등록한 route가 먼저 적용되므로 검색을 뒤에 둔다.
  const state = await useFakeSearch(page);
  await page.goto(`/search?scope=source&sourceId=${E2E_VIDEO_ID}`);

  await page.getByLabel("이미지로 찾기").setInputFiles({
    name: "crane.png",
    mimeType: "image/png",
    buffer: Buffer.from("png-bytes"),
  });

  await expect(page.getByRole("list", { name: "검색 결과" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByText("이미지로 검색")).toBeVisible();
  expect(state.imageUploads).toHaveLength(1);
  const upload = state.imageUploads[0];
  expect(upload?.contentType).toMatch(/^multipart\/form-data; boundary=/);
  expect(upload?.body).toContain('name="image"; filename="crane.png"');
  expect(upload?.body).toContain("png-bytes");
  expect(upload?.body).toContain(`name="sourceId"\r\n\r\n${E2E_VIDEO_ID}`);
});

test("[SPEC-033 NFR-1] 결과 50개를 응답 뒤 200ms 안에 그리고 화면 밖 썸네일은 받지 않는다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeAnalysis(page);
  // 영상·재생은 useFakeAnalysis가 맡는다. 나중에 등록한 route가 먼저 적용되므로 검색을 뒤에 둔다.
  const state = await useFakeSearch(page, {
    sourceSearch: momentSearchBody({
      results: momentList(50).map((moment, index) => ({
        ...moment,
        thumbnailUrl: thumbnailUrl(index),
      })),
    }),
  });
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelectorAll('[aria-label="검색 결과"] > li').length >= 50) {
        Object.assign(window, { renderedAt: performance.now() });
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto(SEARCH);

  await expect(page.getByRole("list", { name: "검색 결과" }).getByRole("listitem")).toHaveCount(50);
  const timings = await page.evaluate(() => ({
    respondedAt: Math.max(
      ...performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/moments?"))
        .map((entry) => (entry instanceof PerformanceResourceTiming ? entry.responseEnd : 0)),
    ),
    renderedAt: "renderedAt" in window ? Number(window.renderedAt) : Number.POSITIVE_INFINITY,
  }));
  expect(timings.renderedAt - timings.respondedAt).toBeLessThan(RENDER_BUDGET_MS);
  // 맨 아래 결과의 썸네일은 화면에서 멀어 받지 않는다(loading="lazy").
  expect(state.thumbnailRequests).not.toContain(thumbnailUrl(49));
  expect(state.thumbnailRequests.length).toBeLessThan(50);
  await noHorizontalScroll(page);
});
