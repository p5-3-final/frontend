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

  it("[SPEC-033 R-2] 결과 위에 대상어·해석 방법과 장면 외형 기준 안내를 보인다", async () => {
    const { stopRecording } = renderSearch(SOURCE_PATH);

    const header = await screen.findByRole("region", { name: "검색 결과 안내" });
    expect(within(header).getByText("person without a hard hat")).toBeVisible();
    expect(within(header).getByText("산업 현장 규칙으로 해석")).toBeVisible();
    expect(within(header).getByText("장면 외형 기준 검색입니다.")).toBeVisible();
    expect(within(header).queryByText("저장된 결과를 다시 보여 줍니다.")).not.toBeInTheDocument();
    stopRecording();
  });

  it("[SPEC-033 R-2] 재사용 결과이면 그 표시를 보인다", async () => {
    const { stopRecording } = renderSearch(SOURCE_PATH, {
      fixture: { sourceSearch: momentSearchBody({ reused: true }) },
    });

    expect(await screen.findByText("저장된 결과를 다시 보여 줍니다.")).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-3] notFound면 찾지 못함을 먼저 보이고 결과는 참고 결과로 보인다", async () => {
    const { stopRecording } = renderSearch(SOURCE_PATH, {
      fixture: { sourceSearch: momentSearchBody({ notFound: true }) },
    });

    const notFound = await screen.findByText("찾지 못했습니다.");
    const reference = screen.getByRole("list", { name: "참고 결과" });
    // 문서 순서상 "찾지 못함"이 목록보다 앞이다.
    expect(
      notFound.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(reference).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("list", { name: "검색 결과" })).not.toBeInTheDocument();
    stopRecording();
  });

  it("[SPEC-033 R-4] degraded면 이유에 맞는 안내를 결과 위에 보인다", async () => {
    const { stopRecording } = renderSearch(SOURCE_PATH, {
      fixture: {
        sourceSearch: momentSearchBody({ degraded: { reason: "precise_quota_exceeded" } }),
      },
    });

    const header = await screen.findByRole("region", { name: "검색 결과 안내" });
    expect(
      within(header).getByText("정밀 검색 사용 한도를 넘어 기본 순위로 보여 줍니다."),
    ).toBeVisible();
    stopRecording();
  });
});
