import { describe, expect, it } from "vitest";
import { isAutoJudgedAfterReanalysis, reviewReasonName } from "./reviewReason";

describe("reviewReason", () => {
  it("[SPEC-035 R-21] 알려진 사유는 한국어 이름, 모르는 사유는 원래 값을 보인다", () => {
    expect(reviewReasonName("review_required")).toBe("검토 필요");
    expect(reviewReasonName("call_cap_reached")).toBe("호출 상한 도달");
    expect(reviewReasonName("future_reason")).toBe("future_reason");
  });

  it("[SPEC-035 R-21] 예산 초과·호출 상한만 재분석 뒤 자동 판정 대상이다", () => {
    expect(isAutoJudgedAfterReanalysis("budget_exceeded")).toBe(true);
    expect(isAutoJudgedAfterReanalysis("call_cap_reached")).toBe(true);
    expect(isAutoJudgedAfterReanalysis("model_unavailable")).toBe(false);
    expect(isAutoJudgedAfterReanalysis("review_required")).toBe(false);
  });
});
