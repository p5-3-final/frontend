import { describe, expect, it } from "vitest";
import {
  answerBody,
  groundingClipBody,
  momentList,
  momentSearchBody,
} from "../../../../mocks/search";
import { answerResultSchema, groundingClipSchema, momentSearchResultSchema } from "./schemas";

describe("search 응답 스키마", () => {
  it("[SPEC-033 R-1] 계약 예시의 검색 결과를 읽는다", () => {
    const parsed = momentSearchResultSchema.parse(momentSearchBody());
    expect(parsed.results[0]?.grounding.status).toBe("REQUESTED");
    expect(parsed.degraded).toBeNull();
  });

  it("[SPEC-033 R-1] 결과는 최대 50개까지만 받는다", () => {
    expect(
      momentSearchResultSchema.safeParse(momentSearchBody({ results: momentList(50) })).success,
    ).toBe(true);
    expect(
      momentSearchResultSchema.safeParse(momentSearchBody({ results: momentList(51) })).success,
    ).toBe(false);
  });

  it("[SPEC-033 R-9] 계약 예시의 영상 질문 답을 읽는다", () => {
    expect(answerResultSchema.parse(answerBody()).relatedEvents).toHaveLength(1);
    expect(answerResultSchema.parse(answerBody({ answer: null })).answer).toBeNull();
  });

  it("[SPEC-033 R-5] 계약 예시의 주석 클립을 읽는다", () => {
    expect(groundingClipSchema.parse(groundingClipBody()).frames?.[0]?.ptsMs).toBe(40000);
  });
});
