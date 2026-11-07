import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { momentSearchBody, SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { renderSearch, searchPath, searchRequests } from "../../../../tests/searchScreen";
import { ApiError } from "../../../shared/api/problem";
import { searchMomentsByImage } from "../api/searchApi";

// jsdom의 FormData·File은 테스트 환경의 fetch(undici)가 내용을 읽지 못한다. 그래서 이미지 업로드만 API 함수 경계에서 바꾸고,
// 실제 multipart 전송은 브라우저에서 도는 E2E(tests/e2e/search.spec.ts)로 확인한다.
vi.mock("../api/searchApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/searchApi")>()),
  searchMomentsByImage: vi.fn(),
}));
const searchByImage = vi.mocked(searchMomentsByImage);

beforeEach(() => {
  searchByImage.mockReset();
  searchByImage.mockResolvedValue(
    momentSearchBody({ parseMethod: "image", targets: [], query: "", canonicalQuery: "" }),
  );
});

function imageFile(name: string, type: string, size = 10) {
  return new File([new Uint8Array(size)], name, { type });
}

function sent() {
  return searchByImage.mock.calls.map(([image, sourceId]) => ({ name: image.name, sourceId }));
}

async function choose(file: File) {
  const input = await screen.findByLabelText("이미지로 찾기");
  fireEvent.change(input, { target: { files: [file] } });
}

describe("ImageSearchInput", () => {
  it("[SPEC-033 R-8] 이 영상 범위에서 jpg를 고르면 sourceId와 함께 이미지 검색을 요청하고 결과를 보인다", async () => {
    const { router, stopRecording } = renderSearch(
      searchPath({ scope: "source", sourceId: SEARCH_SOURCE_ID }),
    );

    await choose(imageFile("crane.jpg", "image/jpeg"));

    expect(await screen.findByRole("list", { name: "검색 결과" })).toBeVisible();
    expect(screen.getByText("이미지로 검색")).toBeVisible();
    expect(sent()).toEqual([{ name: "crane.jpg", sourceId: SEARCH_SOURCE_ID }]);
    expect(router.state.location.search).toBe("?image=last");
    stopRecording();
  });

  it("[SPEC-033 R-8] 내 영상 전체 범위면 sourceId 없이 보낸다", async () => {
    const { stopRecording } = renderSearch(searchPath());

    await choose(imageFile("crane.png", "image/png"));

    await waitFor(() => {
      expect(sent()).toEqual([{ name: "crane.png", sourceId: undefined }]);
    });
    stopRecording();
  });

  it("[SPEC-033 R-8] 다른 형식이나 5MB를 넘는 이미지는 올리지 않고 이유를 보인다", async () => {
    const { requests, stopRecording } = renderSearch();

    await choose(imageFile("a.gif", "image/gif"));
    expect(
      await screen.findByText("jpg, png, webp 이미지를 5MB 이하로 올려 주세요."),
    ).toBeVisible();

    await choose(imageFile("big.jpg", "image/jpeg", 5_242_881));
    expect(searchRequests(requests)).toEqual([]);
    stopRecording();
  });

  it("[SPEC-033 R-12] 영상 상세에 갔다 돌아오면 다시 올리지 않고 마지막 이미지 검색 결과를 보인다", async () => {
    const { user, router, requests, stopRecording } = renderSearch(searchPath());
    await choose(imageFile("crane.jpg", "image/jpeg"));

    await user.click(await screen.findByRole("link", { name: "00:40–00:50 장면 보기" }));
    await screen.findByRole("heading", { name: "crane.mp4" });
    await router.navigate(-1);

    expect(await screen.findByRole("list", { name: "검색 결과" })).toBeVisible();
    expect(searchByImage).toHaveBeenCalledTimes(1);
    expect(searchRequests(requests)).toEqual([]);
    stopRecording();
  });

  it("[SPEC-033 R-12] 새로고침으로 마지막 결과가 없으면 이미지를 다시 올리라고 안내한다", async () => {
    const { stopRecording } = renderSearch(searchPath({ image: "last" }));

    expect(
      await screen.findByText("이미지 검색 결과가 없습니다. 이미지를 다시 올려 주세요."),
    ).toBeVisible();
    stopRecording();
  });

  it("[SPEC-033 R-8] 서버가 이미지를 거절하면(400) 이미지 입력 옆에 이유를 보인다", async () => {
    searchByImage.mockRejectedValue(new ApiError(400, "SEARCH_IMAGE_INVALID"));
    const { stopRecording } = renderSearch();

    await choose(imageFile("crane.jpg", "image/jpeg"));

    const input = await screen.findByLabelText("이미지로 찾기");
    await waitFor(() => {
      expect(input).toHaveAccessibleDescription("jpg, png, webp 이미지를 5MB 이하로 올려 주세요.");
    });
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    stopRecording();
  });
});
