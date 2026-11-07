import { describe, expect, it } from "vitest";
import { degradedMessage } from "./degraded";

describe("축소 응답 안내", () => {
  it.each([
    ["rerank_timeout", "정밀 검색이 제시간에 끝나지 않아 기본 순위로 보여 줍니다."],
    ["circuit_open", "정밀 검색을 잠시 쓸 수 없어 기본 순위로 보여 줍니다."],
    ["precise_quota_exceeded", "정밀 검색 사용 한도를 넘어 기본 순위로 보여 줍니다."],
    ["ai_unavailable", "AI 기능을 쓸 수 없어 텍스트 검색 결과만 보여 줍니다."],
  ] as const)("[SPEC-033 R-4] %s면 이유에 맞는 안내를 고른다", (reason, message) => {
    expect(degradedMessage({ reason })).toBe(message);
  });

  it("[SPEC-033 R-4] 축소 응답이 아니면 안내가 없다", () => {
    expect(degradedMessage(null)).toBeUndefined();
  });
});
