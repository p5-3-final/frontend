import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEARCH_SOURCE_ID } from "../../mocks/search";
import { renderSearch, searchPath, searchRequests } from "../../tests/searchScreen";

const SOURCE_PATH = searchPath({
  q: "안전모 안 쓴 작업자",
  scope: "source",
  sourceId: SEARCH_SOURCE_ID,
});

describe("검색 흐름", () => {
  it("[SPEC-033 R-1] 사이드바 검색 메뉴는 준비 중 안내 대신 검색 화면을 연다", async () => {
    const { stopRecording } = renderSearch();

    expect(await screen.findByRole("heading", { name: "검색", level: 1 })).toBeVisible();
    expect(screen.queryByText("준비 중인 기능입니다.")).not.toBeInTheDocument();
    stopRecording();
  });

  it("[SPEC-033 R-12] 결과를 누르면 영상 상세가 seekMs로 열리고, 돌아오면 다시 묻지 않고 같은 결과를 보인다", async () => {
    const { user, router, requests, stopRecording } = renderSearch(SOURCE_PATH);

    await user.click(await screen.findByRole("link", { name: "00:40–00:50 장면 보기" }));

    expect(await screen.findByRole("heading", { name: "crane.mp4" })).toBeVisible();
    expect(router.state.location.pathname).toBe(`/analysis/videos/${SEARCH_SOURCE_ID}`);
    expect(router.state.location.search).toBe("?t=38000");
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    await waitFor(() => {
      expect(video.currentTime).toBe(38);
    });

    await router.navigate(-1);

    expect(await screen.findByRole("link", { name: "00:40–00:50 장면 보기" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "검색어" })).toHaveValue("안전모 안 쓴 작업자");
    const searches = searchRequests(requests).filter((path) => path.includes("/moments?"));
    expect(searches).toHaveLength(1);
    stopRecording();
  });
});
