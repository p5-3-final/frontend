import { describe, expect, it } from "vitest";
import { labelFormSchema, type LabelFormValues } from "./labelSchema";

const VALID: LabelFormValues = {
  verdict: "incorrect",
  eventPresent: true,
  eventType: "ppe_missing",
  startSec: "96",
  endSec: "104",
  severity: "medium",
  note: "조끼만 없음",
};

function messages(values: LabelFormValues) {
  const result = labelFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("labelFormSchema", () => {
  it("[SPEC-035 R-5] 올바른 입력은 초를 ms로 바꾼 계약 라벨이 된다", () => {
    expect(labelFormSchema.parse(VALID)).toEqual({
      verdict: "incorrect",
      eventPresent: true,
      eventType: "ppe_missing",
      startMs: 96000,
      endMs: 104000,
      severity: "medium",
      note: "조끼만 없음",
    });
  });

  it("[SPEC-035 R-5] 판정을 고르지 않으면 거절한다", () => {
    expect(messages({ ...VALID, verdict: "" })).toContain("판정이 맞았는지 골라 주세요.");
  });

  it("[SPEC-035 R-5] 이벤트 유무가 켜지면 유형·시작·끝이 필수다", () => {
    expect(messages({ ...VALID, eventType: "" })).toContain("이벤트 유형을 골라 주세요.");
    expect(messages({ ...VALID, startSec: "", endSec: "" })).toContain(
      "이벤트 구간의 시작·끝 시각을 넣어 주세요.",
    );
  });

  it("[SPEC-035 R-5] 끝 시각이 시작보다 뒤가 아니면 거절한다", () => {
    expect(messages({ ...VALID, startSec: "104", endSec: "104" })).toContain(
      "끝 시각은 시작 시각보다 뒤여야 합니다.",
    );
  });

  it("[SPEC-035 R-5] 이벤트 유무가 꺼지면 유형을 비우고 구간 없이도 저장한다", () => {
    const label = labelFormSchema.parse({
      ...VALID,
      eventPresent: false,
      startSec: "",
      endSec: "",
    });
    expect(label.eventType).toBeNull();
    expect(label.startMs).toBeNull();
  });

  it("[SPEC-035 R-5] 메모는 500자까지다", () => {
    expect(messages({ ...VALID, note: "가".repeat(501) })).toContain(
      "메모는 500자까지 쓸 수 있습니다.",
    );
    expect(messages({ ...VALID, note: "가".repeat(500) })).toEqual([]);
  });
});
