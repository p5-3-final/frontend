import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { renderSearch, searchRequests } from "../../../../tests/searchScreen";

describe("SearchForm", () => {
  it("[SPEC-033 R-1] 이 영상 범위로 질의와 정밀 검색 선택값을 보내 영상 안 검색을 요청한다", async () => {
    const { user, requests, stopRecording } = renderSearch();

    await user.click(await screen.findByRole("radio", { name: "이 영상" }));
    await user.selectOptions(await screen.findByRole("combobox", { name: "영상" }), "crane.mp4");
    await user.type(screen.getByRole("searchbox", { name: "검색어" }), "안전모 안 쓴 작업자");
    await user.click(screen.getByRole("checkbox", { name: "정밀 검색" }));
    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(searchRequests(requests)).toEqual([
        `/api/v1/search/sources/${SEARCH_SOURCE_ID}/moments?q=${encodeURIComponent("안전모 안 쓴 작업자").replaceAll("%20", "+")}&precise=true`,
      ]);
    });
    stopRecording();
  });

  it("[SPEC-033 R-1] 영상 고르기에는 분석이 끝난(READY) 내 영상만 보인다", async () => {
    const { user, stopRecording } = renderSearch();

    await user.click(await screen.findByRole("radio", { name: "이 영상" }));
    const select = await screen.findByRole("combobox", { name: "영상" });

    expect(await screen.findByRole("option", { name: "crane.mp4" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "processing.mp4" })).not.toBeInTheDocument();
    expect(select).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-1] 질의가 비어 있으면 요청하지 않고 이유를 보인다", async () => {
    const { user, requests, stopRecording } = renderSearch();

    await user.type(await screen.findByRole("searchbox", { name: "검색어" }), "   ");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(await screen.findByText("검색어를 1~200자로 입력해 주세요.")).toBeVisible();
    expect(searchRequests(requests)).toEqual([]);
    stopRecording();
  });

  it("[SPEC-033 R-7] 내 영상 전체면 정밀 검색을 끄고 막은 채 전체 검색을 요청한다", async () => {
    const { user, requests, stopRecording } = renderSearch();

    await user.click(await screen.findByRole("radio", { name: "이 영상" }));
    await user.click(screen.getByRole("checkbox", { name: "정밀 검색" }));
    await user.click(screen.getByRole("radio", { name: "내 영상 전체" }));
    const precise = screen.getByRole("checkbox", { name: "정밀 검색" });
    expect(precise).toBeDisabled();
    expect(precise).not.toBeChecked();

    await user.type(screen.getByRole("searchbox", { name: "검색어" }), "지게차");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await waitFor(() => {
      expect(searchRequests(requests)).toEqual([
        `/api/v1/search/moments?q=${encodeURIComponent("지게차")}`,
      ]);
    });
    stopRecording();
  });
});
