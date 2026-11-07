import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

describe("ReviewFilters", () => {
  it("[SPEC-035 R-21] 사유 필터에 v5.1 사유까지 고를 수 있고 고른 사유로 요청한다", async () => {
    const recorder = recordRequests();
    const { user } = renderQuality("/quality/review");
    await screen.findByRole("table", { name: "검토 항목" });

    const reason = screen.getByLabelText("사유");
    expect(
      within(reason)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "전체",
      "검토 필요",
      "표본",
      "예산 초과",
      "호출 상한 도달",
      "모델 없음",
      "알림 기각",
    ]);
    await user.selectOptions(reason, "budget_exceeded");

    const list = await screen.findByRole("table", { name: "검토 항목" });
    await expect.poll(() => within(list).queryAllByRole("row").length).toBe(2);
    const last = recorder.requests
      .filter((url) => url.pathname === "/api/v1/quality/review-items")
      .at(-1);
    expect(last?.searchParams.get("reason")).toBe("budget_exceeded");
    recorder.stop();
  });

  it("[SPEC-035 R-21] 예산·상한 사유 항목에는 목록에서도 재분석 뒤 자동 판정 안내를 보인다", async () => {
    renderQuality("/quality/review");

    const list = await screen.findByRole("table", { name: "검토 항목" });
    const rows = within(list).getAllByRole("row").slice(1);
    expect(rows[1]).toHaveTextContent("재분석 뒤 자동 판정됨");
    expect(rows[0]).not.toHaveTextContent("재분석 뒤 자동 판정됨");
  });
});
