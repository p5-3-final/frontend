import type { components } from "../../../api/generated/quality-service";

type ReviewReasonParam = components["parameters"]["ReviewReason"];

/** 목록 필터로 고를 수 있는 사유(계약 ReviewReason 파라미터). 응답의 사유는 열린 목록이라 이 밖의 값도 올 수 있다. */
export const REVIEW_REASON_FILTERS = [
  "review_required",
  "sample",
  "budget_exceeded",
  "call_cap_reached",
  "model_unavailable",
  "alert_dismissed",
] as const satisfies readonly ReviewReasonParam[];

const REVIEW_REASON_NAMES: Readonly<Record<string, string>> = {
  review_required: "검토 필요",
  sample: "표본",
  budget_exceeded: "예산 초과",
  call_cap_reached: "호출 상한 도달",
  model_unavailable: "모델 없음",
  alert_dismissed: "알림 기각",
};

/** 사유 한국어 이름. 모르는 값은 원래 값을 그대로 보인다(SPEC-035 R-21, 열린 목록). */
export function reviewReasonName(reason: string): string {
  return REVIEW_REASON_NAMES[reason] ?? reason;
}

// SPEC-035 R-21: 예산·호출 상한으로 판정을 건너뛴 항목은 재분석하면 다시 판정되므로 라벨 대신 재분석을 고를 수 있게 알린다.
const AUTO_JUDGED_AFTER_REANALYSIS = new Set(["budget_exceeded", "call_cap_reached"]);

export const REANALYSIS_NOTICE_SHORT = "재분석 뒤 자동 판정됨";
export const REANALYSIS_NOTICE = `${REANALYSIS_NOTICE_SHORT}: 예산·호출 상한으로 판정을 건너뛴 항목이라 재분석하면 다시 판정합니다.`;

/** 재분석하면 자동으로 판정되는 사유인지 */
export function isAutoJudgedAfterReanalysis(reason: string): boolean {
  return AUTO_JUDGED_AFTER_REANALYSIS.has(reason);
}
