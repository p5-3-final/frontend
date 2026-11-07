import { describe, expect, it } from "vitest";
import { parseSearchCriteria, toSearchParams } from "./searchParams";

const SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

describe("검색 조건 URL", () => {
  it("[SPEC-033 R-12] 영상 범위 조건을 URL에서 읽는다", () => {
    const params = new URLSearchParams({
      q: "안전모",
      scope: "source",
      sourceId: SOURCE_ID,
      precise: "1",
    });
    expect(parseSearchCriteria(params)).toEqual({
      kind: "text",
      q: "안전모",
      scope: "source",
      sourceId: SOURCE_ID,
      precise: true,
    });
  });

  it("[SPEC-033 R-7] 전체 범위면 정밀 검색을 끈다", () => {
    const params = new URLSearchParams({ q: "안전모", scope: "all", precise: "1" });
    expect(parseSearchCriteria(params)).toEqual({
      kind: "text",
      q: "안전모",
      scope: "all",
      precise: false,
    });
  });

  it("[SPEC-033 R-1] 질의가 없거나 200자를 넘거나 영상 ID가 UUID가 아니면 조건이 없다", () => {
    expect(parseSearchCriteria(new URLSearchParams())).toBeUndefined();
    expect(
      parseSearchCriteria(new URLSearchParams({ q: "가".repeat(201), scope: "all" })),
    ).toBeUndefined();
    expect(parseSearchCriteria(new URLSearchParams({ q: "   ", scope: "all" }))).toBeUndefined();
    expect(
      parseSearchCriteria(new URLSearchParams({ q: "안전모", scope: "source", sourceId: "x" })),
    ).toBeUndefined();
  });

  it("[SPEC-033 R-12] 이미지 검색은 image=last로 마지막 결과를 가리킨다", () => {
    expect(parseSearchCriteria(new URLSearchParams({ image: "last" }))).toEqual({ kind: "image" });
  });

  it("[SPEC-033 R-12] 조건을 URL로 바꾸고 다시 읽으면 같다", () => {
    const criteria = {
      kind: "text",
      q: "안전모",
      scope: "source",
      sourceId: SOURCE_ID,
      precise: false,
    } as const;
    expect(toSearchParams(criteria).toString()).toBe(
      `q=%EC%95%88%EC%A0%84%EB%AA%A8&scope=source&sourceId=${SOURCE_ID}`,
    );
    expect(parseSearchCriteria(toSearchParams(criteria))).toEqual(criteria);
    expect(toSearchParams({ kind: "image" }).toString()).toBe("image=last");
  });
});
