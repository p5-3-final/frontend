import { describe, expect, it } from "vitest";
import { evaluationRunBody } from "../../../../mocks/quality";
import { failureRows, formatDiff, gateOutcome, sortedMetrics } from "./gate";
import { evaluationRunSchema } from "./schemas";

const run = (overrides: Parameters<typeof evaluationRunBody>[0] = {}) =>
  evaluationRunSchema.parse(evaluationRunBody(overrides));

describe("gate", () => {
  it("[SPEC-035 R-12] Gate 결과는 통과·실패·기준 없음 셋이다", () => {
    expect(gateOutcome(run())).toBe("failed");
    expect(
      gateOutcome(
        run({ gate: { baselineRunId: "b", passed: true, tolerance: 0.02, failures: [] } }),
      ),
    ).toBe("passed");
    expect(
      gateOutcome(
        run({ gate: { baselineRunId: null, passed: null, tolerance: 0.02, failures: [] } }),
      ),
    ).toBe("no_baseline");
  });

  it("[SPEC-035 R-13] 실패 지표의 차이는 실행값 − 기준값이고 이름·유형 순이다", () => {
    const rows = failureRows([
      { name: "recall_at_50", eventType: null, baseline: 0.6, value: 0.5 },
      { name: "judge_precision", eventType: "ppe_missing", baseline: 0.78, value: 0.74 },
    ]);
    expect(rows.map((row) => row.name)).toEqual(["judge_precision", "recall_at_50"]);
    expect(rows[0]?.diff).toBeCloseTo(-0.04);
    expect(formatDiff(rows[0]?.diff ?? null)).toBe("-0.0400");
    expect(formatDiff(0.0123)).toBe("+0.0123");
  });

  it("[SPEC-035 R-13] 이번 실행에서 빠진 지표(value null)는 차이가 없다", () => {
    const rows = failureRows([
      { name: "judge_recall", eventType: null, baseline: 0.7, value: null },
    ]);
    expect(rows[0]?.diff).toBeNull();
    expect(formatDiff(null)).toBe("-");
  });

  it("[SPEC-035 R-13] 전체 지표는 이름·유형 순으로 정렬하고 유형 없는 전체 지표가 앞이다", () => {
    const metrics = sortedMetrics([
      { name: "judge_precision", eventType: "ppe_missing", value: 0.74, higherIsBetter: true },
      { name: "candidate_recall", eventType: "ppe_missing", value: 0.81, higherIsBetter: true },
      { name: "candidate_recall", eventType: null, value: 0.8, higherIsBetter: true },
    ]);
    expect(metrics.map((m) => `${m.name}:${m.eventType ?? "-"}`)).toEqual([
      "candidate_recall:-",
      "candidate_recall:ppe_missing",
      "judge_precision:ppe_missing",
    ]);
  });
});
