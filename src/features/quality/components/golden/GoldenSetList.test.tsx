import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BASELINE_RUN_ID, GOLDEN_SET_ID } from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

describe("GoldenSetList", () => {
  it("[SPEC-035 R-8] 이름·분할·출처·초안 수·최신 버전·기준 실행을 보인다", async () => {
    renderQuality("/quality/golden-sets");

    const table = await screen.findByRole("table", { name: "Golden Set 목록" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0] ?? table).getByRole("link", { name: "ppe-eval" })).toHaveAttribute(
      "href",
      `/quality/golden-sets/${GOLDEN_SET_ID}`,
    );
    expect(rows[0]).toHaveTextContent("평가(eval)");
    expect(rows[0]).toHaveTextContent("검토");
    expect(rows[0]).toHaveTextContent("v3");
    expect(within(rows[0] ?? table).getByRole("link", { name: "기준 실행" })).toHaveAttribute(
      "href",
      `/quality/runs/${BASELINE_RUN_ID}`,
    );
    expect(rows[1]).toHaveTextContent("가져오기");
    expect(within(rows[1] ?? table).queryByRole("link", { name: "기준 실행" })).toBeNull();
  });
});
