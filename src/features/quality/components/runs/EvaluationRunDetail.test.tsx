import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../../mocks/handlers";
import {
  BASELINE_RUN_ID,
  QUALITY_API,
  RUN_ID,
  evaluationRunBody,
} from "../../../../../mocks/quality";
import { renderQuality } from "../../../../../tests/quality";

describe("EvaluationRunDetail", () => {
  it("[SPEC-035 R-13] 실패한 실행은 실패 지표를 기준값·실행값·차이와 함께 맨 위에 강조하고 그 아래 전체 지표를 보인다", async () => {
    renderQuality(`/quality/runs/${RUN_ID}`);

    const failures = await screen.findByRole("table", { name: "실패 지표" });
    const row = within(failures).getAllByRole("row")[1];
    expect(row).toHaveTextContent("judge_precision");
    expect(row).toHaveTextContent("보호구 미착용");
    expect(row).toHaveTextContent("0.7800");
    expect(row).toHaveTextContent("0.7400");
    expect(row).toHaveTextContent("-0.0400");
    expect(screen.getByText("Gate 실패")).toBeVisible();
    const all = screen.getByRole("table", { name: "전체 지표" });
    expect(
      within(all)
        .getAllByRole("row")
        .slice(1)
        .map((r) => r.firstChild?.textContent),
    ).toEqual(["candidate_recall", "judge_precision"]);
    const tables = screen.getAllByRole("table");
    expect(tables.indexOf(failures)).toBeLessThan(tables.indexOf(all));
    expect(screen.getByRole("region", { name: "버전" })).toHaveTextContent("gpt-6.1-terra");
  });

  it("[SPEC-035 R-13] 이번 실행에서 빠진 실패 지표는 이번 실행에 없음으로 보인다", async () => {
    renderQuality(`/quality/runs/${RUN_ID}`, {
      fixture: {
        runs: [
          evaluationRunBody({
            gate: {
              baselineRunId: BASELINE_RUN_ID,
              passed: false,
              tolerance: 0.02,
              failures: [{ name: "judge_recall", eventType: null, baseline: 0.7, value: null }],
            },
          }),
        ],
      },
    });

    const failures = await screen.findByRole("table", { name: "실패 지표" });
    expect(within(failures).getByText("이번 실행에 없음")).toBeVisible();
  });

  it("[SPEC-035 R-13] 기준 실행이 없는 실행은 기준 실행 없음을 보인다", async () => {
    renderQuality(`/quality/runs/${BASELINE_RUN_ID}`);

    expect(await screen.findByText("기준 실행 없음")).toBeVisible();
    expect(screen.queryByRole("table", { name: "실패 지표" })).not.toBeInTheDocument();
  });

  it("[SPEC-035 R-11] 기준으로 지정을 누르면 그 실행의 Golden Set 기준 실행을 바꾼다", async () => {
    const { user } = renderQuality(`/quality/runs/${RUN_ID}`);
    await screen.findByRole("table", { name: "실패 지표" });

    await user.click(await screen.findByRole("button", { name: "기준으로 지정" }));

    expect(await screen.findByText("ppe-eval의 기준 실행으로 지정했습니다.")).toBeVisible();
    expect(await screen.findByText("현재 기준 실행")).toBeVisible();
  });

  it("[SPEC-035 R-11] 다른 세트의 실행이면(409) 안내를 보인다", async () => {
    const { user } = renderQuality(`/quality/runs/${RUN_ID}`, {
      extra: [
        http.put(`${QUALITY_API}/golden-sets/:setId/baseline`, () =>
          problem(409, "QUALITY_RUN_SET_MISMATCH"),
        ),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "기준으로 지정" }));

    expect(await screen.findByText("다른 Golden Set의 실행입니다.")).toBeVisible();
  });
});
