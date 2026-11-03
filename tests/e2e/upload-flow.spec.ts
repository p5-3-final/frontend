import { expect, test } from "@playwright/test";
import { useFakeApi } from "./fakeApi";
import { useFakeMedia } from "./fakeMedia";

const videoFile = (name: string, size: number) => ({
  name,
  mimeType: "video/mp4",
  buffer: Buffer.alloc(size, 1),
});

test("[SPEC-005 R-1] [SPEC-005 R-5] [SPEC-005 R-6] [SPEC-005 R-7] [SPEC-005 R-19] 단일·멀티파트로 올린 영상이 목록에 보이고 삭제한다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  const { storage } = await useFakeMedia(page);
  await page.goto("/analysis");
  await expect(page.getByText("올린 영상이 없습니다.")).toBeVisible();

  await page
    .getByLabel("영상 파일 고르기")
    .setInputFiles([videoFile("small.mp4", 60), videoFile("big.mp4", 120)]);

  const list = page.getByRole("list", { name: "내 영상" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByText("업로드 완료")).toHaveCount(2);
  expect(storage.posts).toBe(1);
  expect(storage.partSizes.sort((a, b) => b - a)).toEqual([50, 50, 20]);

  await page.getByRole("button", { name: "small.mp4 삭제" }).click();
  const dialog = page.getByRole("dialog", { name: "영상 삭제" });
  await expect(dialog).toContainText("small.mp4");
  await dialog.getByRole("button", { name: "삭제" }).click();

  await expect(dialog).toBeHidden();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list.getByText("big.mp4")).toBeVisible();
});

test("[SPEC-005 R-2] 지원하지 않는 형식은 올리지 않고 이유를 보여 준다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  const { storage } = await useFakeMedia(page);
  await page.goto("/analysis");

  await page.getByLabel("영상 파일 고르기").setInputFiles([videoFile("clip.gif", 10)]);

  await expect(page.getByText("mp4, mov, mkv, avi 영상만 올릴 수 있습니다.")).toBeVisible();
  expect(storage.posts).toBe(0);
});

test("[SPEC-005 NFR-6] 업로드 대기열과 내 영상 목록은 가로 스크롤이 없다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeMedia(page);
  await page.goto("/analysis");
  await page
    .getByLabel("영상 파일 고르기")
    .setInputFiles([
      videoFile("a-very-long-file-name-from-a-parking-lot-camera-2026-11-03-0930.mp4", 60),
      videoFile("clip.gif", 10),
    ]);
  await expect(page.getByRole("list", { name: "내 영상" }).getByRole("listitem")).toHaveCount(1);

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
