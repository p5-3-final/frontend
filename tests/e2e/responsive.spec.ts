import { expect, test, type Page } from "@playwright/test";
import { useFakeApi } from "./fakeApi";

async function hasHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

test.describe("반응형 레이아웃", () => {
  for (const path of ["/login", "/signup"]) {
    test(`[SPEC-002 NFR-4] ${path} 화면은 가로 스크롤이 없다`, async ({ page }) => {
      await useFakeApi(page);
      await page.goto(path);
      await expect(page.getByLabel("이메일")).toBeVisible();

      expect(await hasHorizontalScroll(page)).toBe(false);
    });
  }

  test("[SPEC-002 NFR-4] 앱 화면과 사용자 메뉴는 가로 스크롤이 없다", async ({ page }) => {
    await useFakeApi(page, { loggedIn: true });
    await page.goto("/analysis");
    await page.getByRole("button", { name: /테스터/ }).click();
    await expect(page.getByRole("region", { name: "내 계정" })).toBeVisible();

    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test("[SPEC-002 NFR-5] 1024px 미만에서는 사이드바를 숨기고 메뉴 버튼으로 연다", async ({
    page,
  }) => {
    await useFakeApi(page, { loggedIn: true });
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.goto("/analysis");
    const menuButton = page.getByRole("button", { name: "메뉴 열기" });

    await expect(menuButton).toBeVisible();
    await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeHidden();

    await menuButton.click();
    const drawer = page.getByRole("dialog", { name: "메뉴" });
    await drawer.getByRole("link", { name: "이벤트" }).click();
    await expect(page.getByRole("heading", { name: "이벤트" })).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test("[SPEC-002 NFR-5] 1024px 이상에서는 사이드바를 보이고 메뉴 버튼을 숨긴다", async ({
    page,
  }) => {
    await useFakeApi(page, { loggedIn: true });
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/analysis");

    await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeVisible();
    await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeHidden();
  });
});
