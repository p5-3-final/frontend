import { expect, test, type Page } from "@playwright/test";
import { useFakeApi } from "./fakeApi";
import { useFakeMedia } from "./fakeMedia";
import { E2E_BARRIER_EVENT_ID, useFakeSessions } from "./fakeSessions";

// toBeVisible은 짧은 간격으로 다시 확인하므로, 실제로 보인 시각보다 최대 한 번의 확인 간격만큼 늦게 끝난다.
const VISIBILITY_POLL_SLACK_MS = 200;
const NFR2_RENDER_MS = 300;

const videoFile = (name: string) => ({ name, mimeType: "video/mp4", buffer: Buffer.alloc(60, 1) });

async function hasHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

test("[SPEC-034 R-2] [SPEC-034 R-3] [SPEC-034 R-4] [SPEC-034 R-6] [SPEC-034 R-8] [SPEC-034 NFR-2] 세션을 만들고 작업 전·후 영상을 올려 역할별로 보고 흐름 요약에서 이동한다", async ({
  page,
}) => {
  test.setTimeout(40_000);
  await useFakeApi(page, { loggedIn: true });
  const media = await useFakeMedia(page);
  let detailSentAt = 0;
  await useFakeSessions(page, media, {
    onDetailSent: () => {
      detailSentAt = Date.now();
    },
  });

  await page.goto("/history");
  await expect(page.getByText("작업 세션이 없습니다.")).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.getByRole("button", { name: "세션 만들기" }).first().click();
  const form = page.getByRole("form", { name: "세션 만들기" });
  await form.getByLabel("세션 이름").fill("3번 라인 방호벽 교체");
  await form.getByRole("button", { name: "만들기" }).click();
  await expect(page.getByRole("heading", { name: "3번 라인 방호벽 교체" })).toBeVisible();

  await page.getByRole("link", { name: "이 세션에 영상 올리기" }).click();
  await expect(page.getByRole("combobox", { name: "작업 세션" })).toHaveValue(/^0{8}-/);
  const queue = page.getByRole("list", { name: "업로드 대기열" });
  await page.getByRole("radio", { name: "작업 전" }).check();
  await page.getByLabel("영상 파일 고르기").setInputFiles([videoFile("before.mp4")]);
  await expect(queue.getByText("업로드 완료")).toHaveCount(1);
  await page.getByRole("radio", { name: "작업 후" }).check();
  await page.getByLabel("영상 파일 고르기").setInputFiles([videoFile("after.mp4")]);
  await expect(queue.getByText("업로드 완료")).toHaveCount(2);
  expect(await hasHorizontalScroll(page)).toBe(false);

  await page.goto("/history");
  await page.getByRole("link", { name: "3번 라인 방호벽 교체" }).click();
  // NFR-2: 세션 상세 응답 뒤 300ms 안에 역할 칸을 그린다.
  const before = page.getByRole("region", { name: "작업 전 영상" });
  await expect(before).toBeVisible({ timeout: 5_000 });
  expect(Date.now() - detailSentAt).toBeLessThan(NFR2_RENDER_MS + VISIBILITY_POLL_SLACK_MS);
  await expect(before.getByRole("link", { name: "before.mp4" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "작업 후 영상" }).getByRole("link", { name: "after.mp4" }),
  ).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);

  const flow = page.getByRole("region", { name: "세션 흐름 요약" });
  await flow.getByRole("link", { name: /방호 미복구/ }).click();
  await expect(page).toHaveURL(new RegExp(`\\?event=${E2E_BARRIER_EVENT_ID}$`));
  await expect(page.getByRole("heading", { name: "after.mp4" })).toBeVisible();
});

test("[SPEC-034 R-9] 설정 화면에서 학습용 보존 기본값을 바꾼다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  const media = await useFakeMedia(page);
  const fake = await useFakeSessions(page, media);
  await page.goto("/settings");

  const toggle = page.getByRole("switch", { name: "학습용 보존 기본 동의" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();

  await expect(page.getByText("이후에 올리는 영상에 적용됩니다.")).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(fake.retention.defaultConsent).toBe(true);
  expect(await hasHorizontalScroll(page)).toBe(false);
});
