import { expect, test } from "@playwright/test";
import { useFakeApi } from "./fakeApi";
import { useFakeMedia } from "./fakeMedia";

const LONG_NAME = "a-very-long-file-name-from-a-parking-lot-camera-2026-11-03-0930.mp4";

test("[SPEC-006 R-6] [SPEC-006 R-7] [SPEC-006 R-10] 목록에서 상세로 가서 정보를 보고, 재생하지 못하면 안내와 원본 내려받기를 본다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  const { storage } = await useFakeMedia(page);
  await page.goto("/analysis");
  await page
    .getByLabel("영상 파일 고르기")
    .setInputFiles([{ name: LONG_NAME, mimeType: "video/mp4", buffer: Buffer.alloc(60, 1) }]);
  await expect(page.getByRole("list", { name: "내 영상" }).getByText("업로드 완료")).toBeVisible();

  await page.getByRole("link", { name: LONG_NAME }).click();

  await expect(page).toHaveURL(/\/analysis\/videos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: LONG_NAME })).toBeVisible();
  await expect(page.getByText("video/mp4", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "이 브라우저에서 재생할 수 없는 영상입니다. 원본을 내려받아 다른 플레이어로 확인해 주세요.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "원본 내려받기" })).toHaveAttribute(
    "href",
    /X-Amz-Signature=download/,
  );
  expect(storage.gets).toBeGreaterThan(0);
});

test("[SPEC-006 NFR-5] 상세 화면은 가로 스크롤이 없고 플레이어가 화면 너비 안에 들어간다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeMedia(page);
  // 재생 실패 안내로 바뀌기 전의 플레이어 크기를 재려고 저장소 응답을 멈춰 둔다.
  await page.route("http://localhost:8333/vlm-media/sources/**", () => new Promise(() => {}));
  await page.goto("/analysis");
  await page
    .getByLabel("영상 파일 고르기")
    .setInputFiles([{ name: LONG_NAME, mimeType: "video/mp4", buffer: Buffer.alloc(60, 1) }]);
  await page.getByRole("link", { name: LONG_NAME }).click();

  const player = page.getByLabel(`${LONG_NAME} 재생`);
  await expect(player).toBeVisible();
  const box = await player.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.width ?? Infinity).toBeLessThanOrEqual(viewport?.width ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
