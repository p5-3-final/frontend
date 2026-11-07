import type { EvaluationRun, GateFailure, Metric } from "./schemas";

export type GateOutcome = "passed" | "failed" | "no_baseline";

export const GATE_OUTCOME_NAMES: Readonly<Record<GateOutcome, string>> = {
  passed: "통과",
  failed: "실패",
  no_baseline: "기준 없음",
};

/** Gate 결과(SPEC-035 R-12). 기준 실행이 없으면 passed가 null이다. */
export function gateOutcome(run: Pick<EvaluationRun, "gate">): GateOutcome {
  if (run.gate.passed === null) {
    return "no_baseline";
  }
  return run.gate.passed ? "passed" : "failed";
}

export interface FailureRow extends GateFailure {
  /** 실행값 − 기준값. 이번 실행에 없는 지표(value null, 계약 5.0.0)면 null이다. */
  diff: number | null;
}

function byNameThenType(
  a: { name: string; eventType: string | null },
  b: { name: string; eventType: string | null },
): number {
  return a.name.localeCompare(b.name) || (a.eventType ?? "").localeCompare(b.eventType ?? "");
}

/** 실패 지표에 차이를 붙여 이름·유형 순으로 정렬한다(R-13). */
export function failureRows(failures: readonly GateFailure[]): FailureRow[] {
  return failures
    .map((failure) => ({
      ...failure,
      diff: failure.value === null ? null : failure.value - failure.baseline,
    }))
    .toSorted(byNameThenType);
}

/** 전체 지표를 이름·유형 순으로 정렬한다. 유형 없는(전체) 지표가 앞이다(R-13). */
export function sortedMetrics(metrics: readonly Metric[]): Metric[] {
  return metrics.toSorted(byNameThenType);
}

// 지표는 0~1 비율이 대부분이라 허용 하락폭(예 0.02)보다 한 자리 더 보이게 소수 넷째 자리까지 쓴다.
const METRIC_DIGITS = 4;

export function formatMetric(value: number): string {
  return value.toFixed(METRIC_DIGITS);
}

/** 차이를 부호와 함께 보인다. 차이가 없으면(이번 실행에 없음) "-"다. */
export function formatDiff(diff: number | null): string {
  if (diff === null) {
    return "-";
  }
  return `${diff >= 0 ? "+" : "-"}${formatMetric(Math.abs(diff))}`;
}
