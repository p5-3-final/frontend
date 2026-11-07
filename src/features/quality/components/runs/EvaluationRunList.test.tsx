import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GOLDEN_SET_ID, IMPORT_GOLDEN_SET_ID, RUN_ID } from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

describe("EvaluationRunList", () => {
  it("[SPEC-035 R-12] 받은 시각 내림차순으로 Golden Set·버전·종류·트리거·Gate 결과를 보인다", async () => {
    renderQuality("/quality/runs");

    const table = await screen.findByRole("table", { name: "평가 실행 목록" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(await within(rows[0] ?? table).findByText("ppe-eval")).toBeVisible();
    expect(rows[0]).toHaveTextContent("v3");
    expect(rows[0]).toHaveTextContent("이벤트");
    expect(rows[0]).toHaveTextContent("CI");
    expect(rows[0]).toHaveTextContent("실패");
    expect(rows[1]).toHaveTextContent("수동");
    expect(rows[1]).toHaveTextContent("기준 없음");
    expect(within(rows[0] ?? table).getByRole("link", { name: /상세/ })).toHaveAttribute(
      "href",
      `/quality/runs/${RUN_ID}`,
    );
  });

  it("[SPEC-035 R-12] Golden Set을 고르면 그 세트의 실행만 요청한다", async () => {
    const recorder = recordRequests();
    const { user } = renderQuality("/quality/runs");
    await screen.findByRole("table", { name: "평가 실행 목록" });
    const select = screen.getByLabelText("Golden Set");
    await within(select).findByRole("option", { name: "physicalai-events-eval" });

    await user.selectOptions(select, IMPORT_GOLDEN_SET_ID);

    expect(await screen.findByText("평가 실행이 없습니다.")).toBeVisible();
    const last = recorder.requests
      .filter((url) => url.pathname === "/api/v1/quality/evaluation-runs")
      .at(-1);
    expect(last?.searchParams.get("goldenSetId")).toBe(IMPORT_GOLDEN_SET_ID);
    expect(last?.searchParams.get("goldenSetId")).not.toBe(GOLDEN_SET_ID);
    recorder.stop();
  });
});
