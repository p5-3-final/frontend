import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { momentBody, momentSearchBody, SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { renderSearch, searchPath } from "../../../../tests/searchScreen";

const SOURCE_PATH = searchPath({
  q: "안전모 안 쓴 작업자",
  scope: "source",
  sourceId: SEARCH_SOURCE_ID,
});

describe("MomentResults", () => {
  it("[SPEC-033 R-1] 받은 순서대로 썸네일·구간·유사도·찾은 경로를 보인다", async () => {
    const { stopRecording } = renderSearch(SOURCE_PATH, {
      fixture: {
        sourceSearch: momentSearchBody({
          results: [
            momentBody({
              momentId: "0192f320-0000-5000-8000-000000000002",
              startMs: 90000,
              endMs: 100000,
              similarity: 0.2,
              matchedBy: ["text"],
            }),
            momentBody({ similarity: 0.31 }),
          ],
        }),
      },
    });

    const list = await screen.findByRole("list", { name: "검색 결과" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [first, second] = items;
    if (first === undefined || second === undefined) {
      throw new Error("결과 두 개가 필요하다");
    }
    // 서버 순서를 다시 정렬하지 않는다(유사도가 낮은 것이 먼저 와도 그대로).
    expect(within(first).getByText("01:30–01:40")).toBeVisible();
    expect(within(first).getByText("유사도 0.20")).toBeVisible();
    expect(within(first).getByText("텍스트")).toBeVisible();
    expect(within(second).getByText("00:40–00:50")).toBeVisible();
    expect(within(second).getByText("유사도 0.31")).toBeVisible();
    expect(within(second).getByText("시각·텍스트")).toBeVisible();
    expect(within(second).getByRole("img", { name: "00:40–00:50 장면" })).toHaveAttribute(
      "loading",
      "lazy",
    );
    stopRecording();
  });
});
