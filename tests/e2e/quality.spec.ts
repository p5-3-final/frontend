import { expect, test } from "@playwright/test";
import { useFakeApi } from "./fakeApi";
import { useFakeNotifications } from "./fakeNotifications";
import { useFakeQuality } from "./fakeQuality";

// SPEC-035 NFR-1
const RENDER_BUDGET_MS = 300;

test("[SPEC-035 R-3] [SPEC-035 R-6] [SPEC-035 NFR-1] 맡기 → 라벨 → 저장 후 다음이 이어지고 다음 항목이 응답 뒤 300ms 안에 보인다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeQuality(page);
  await page.goto("/quality/review");

  const list = page.getByRole("table", { name: "검토 항목" });
  await list.getByRole("button", { name: "맡기" }).first().click();
  const form = page.getByRole("form", { name: "라벨" });
  await form.getByRole("radio", { name: "틀림" }).check();

  const nextAssigned = page.waitForResponse(
    (response) =>
      response.url().includes("/review-items/0192fa00-0000-5000-8000-000000000002/assignment") &&
      response.status() === 200,
  );
  await form.getByRole("button", { name: "저장 후 다음" }).click();
  await nextAssigned;
  const respondedAt = Date.now();
  await expect(page.getByRole("region", { name: "판정 결과" })).toContainText("쓰러짐");
  expect(Date.now() - respondedAt).toBeLessThan(RENDER_BUDGET_MS);
  await expect(page).toHaveURL(/\/quality\/review\/0192fa00-0000-5000-8000-000000000002/);
});

test("[SPEC-035 R-9] [SPEC-035 R-10] 라벨된 항목을 Golden Set에 넣고 버전을 확정하면 새 버전과 매니페스트 경로가 보인다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeQuality(page);
  await page.goto("/quality/review/0192fa00-0000-5000-8000-000000000003?status=all");

  const panel = page.getByRole("region", { name: "Golden Set에 넣기" });
  await panel.getByRole("button", { name: "초안에 넣기" }).click();
  await expect(panel.getByText("ppe-eval 초안에 넣었습니다.")).toBeVisible();

  await page.goto("/quality/golden-sets");
  await page.getByRole("link", { name: "ppe-eval" }).click();
  await expect(page.getByRole("table", { name: "초안 항목" }).getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "버전 확정" }).click();
  const dialog = page.getByRole("dialog", { name: "버전 확정" });
  await dialog.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "버전 확정" }).click();
  await page
    .getByRole("dialog", { name: "버전 확정" })
    .getByRole("button", { name: "확정" })
    .click();

  await expect(
    page.getByText(/v4를 확정했습니다\. 매니페스트: golden\/.+\/v4\/manifest\.json/),
  ).toBeVisible();
  await expect(page.getByText("초안 항목이 없습니다.")).toBeVisible();
});

test("[SPEC-035 R-13] Gate가 실패한 평가 실행은 실패 지표를 맨 위에 강조해 보인다", async ({
  page,
}) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeQuality(page);
  await page.goto("/quality/runs");

  await page.getByRole("table", { name: "평가 실행 목록" }).getByRole("link").first().click();

  const failures = page.getByRole("table", { name: "실패 지표" });
  await expect(failures).toContainText("judge_precision");
  await expect(failures).toContainText("-0.0400");
});

test("[SPEC-035 R-15] 단계 추이를 조회하면 선 그래프와 표가 보인다", async ({ page }) => {
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await useFakeQuality(page);
  await page.goto("/quality/stages");

  const form = page.getByRole("form", { name: "단계 추이" });
  await form.getByLabel("시작일").fill("2026-11-01");
  await form.getByLabel("종료일").fill("2026-11-06");
  await form.getByRole("button", { name: "조회" }).click();

  await expect(page.getByRole("img", { name: /날짜별 p50·p95 추이/ })).toBeVisible();
  await expect(page.getByRole("table", { name: "단계 추이 값" }).getByRole("row")).toHaveCount(3);
});

test("[SPEC-035 R-1] [SPEC-035 NFR-2] USER의 첫 화면은 품질 묶음을 받지 않고 품질 메뉴도 없다", async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") {
      scripts.push(request.url());
    }
  });
  await useFakeApi(page, { loggedIn: true });
  await useFakeNotifications(page);
  await page.goto("/analysis");

  await expect(page.getByRole("heading", { name: "영상 분석" })).toBeVisible();
  await expect(page.getByRole("button", { name: /테스터/ })).toBeVisible();
  expect(
    scripts.some((url) => url.includes("QualityPage") || url.includes("features/quality")),
  ).toBe(false);
  await expect(page.getByRole("link", { name: "품질" })).toHaveCount(0);
});
