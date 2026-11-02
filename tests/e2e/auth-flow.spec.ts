import { expect, test } from "@playwright/test";
import { useFakeApi } from "./fakeApi";

test("[SPEC-002 US-1~US-4] 가입 → 로그인 → 새로고침 → 내 정보 → 로그아웃", async ({ page }) => {
  await useFakeApi(page);

  await page.goto("/signup");
  await page.getByLabel("이메일").fill("new@example.com");
  await page.getByLabel("비밀번호").fill("secret123");
  await page.getByLabel("닉네임").fill("새사용자");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.getByRole("status")).toHaveText("가입이 완료되었습니다. 로그인해 주세요.");
  await expect(page.getByLabel("이메일")).toHaveValue("new@example.com");
  await page.getByLabel("비밀번호").fill("secret123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/analysis$/);
  await expect(page.getByRole("button", { name: /새사용자/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "영상 분석" })).toBeVisible();
  await page.getByRole("button", { name: /새사용자/ }).click();
  await expect(page.getByRole("region", { name: "내 계정" })).toContainText("new@example.com");

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
