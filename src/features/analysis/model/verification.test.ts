import { describe, expect, it } from "vitest";
import { descriptionText, verificationName } from "./verification";

describe("verification", () => {
  it.each([
    ["confirmed", "확인됨"],
    ["rejected", "이벤트 아님"],
    ["unverified", "미확인(모델 없음)"],
    ["unknown", "판단 불가"],
  ] as const)("[SPEC-031 R-6] 판정 상태 %s를 %s로 보인다", (status, name) => {
    expect(verificationName(status)).toBe(name);
  });

  it.each([
    ["unverified", "판정 모델이 설정되지 않아 설명이 없습니다."],
    ["unknown", "판정할 수 없어 설명이 없습니다."],
    ["rejected", "판정 모델이 이벤트가 아니라고 보았습니다."],
    ["confirmed", "설명이 없습니다."],
  ] as const)("[SPEC-031 R-6] 설명이 null이면 %s 상태의 안내를 쓴다", (status, notice) => {
    expect(descriptionText(status, null)).toBe(notice);
  });

  it("[SPEC-031 R-6] 설명이 있으면 그대로 쓴다", () => {
    expect(descriptionText("unknown", "넘어짐")).toBe("넘어짐");
  });
});
