import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, problem, videoBody } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import type { Video } from "../model/schemas";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

/** 상세 응답을 정하고, 재생 주소 요청 수를 센다. 나중에 등록한 핸들러가 먼저 적용된다. */
function detailServer(video: Partial<Video> | (() => Response)) {
  const counter = { playbacks: 0 };
  server.use(
    handlers.me(),
    http.get(`${MEDIA_API}/:id`, () =>
      typeof video === "function"
        ? video()
        : HttpResponse.json(videoBody({ id: VIDEO_ID, ...video })),
    ),
    http.get(`${MEDIA_API}/:id/playback`, () => {
      counter.playbacks++;
      return undefined;
    }),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return counter;
}

/** 정보 목록(`<dl>`)에서 이름에 해당하는 값 */
function field(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

describe("VideoDetail", () => {
  it("[SPEC-006 R-7] 파일 이름, 크기, 형식, 상태, 올린 시각, 업로드 완료 시각을 보여 준다", async () => {
    detailServer({
      fileName: "parking.mp4",
      sizeBytes: 110_000_000,
      contentType: "video/mp4",
      status: "UPLOADED",
      createdAt: "2026-11-03T00:00:00Z",
      uploadedAt: "2026-11-03T00:05:00Z",
    });
    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    expect(await screen.findByRole("heading", { name: "parking.mp4" })).toBeVisible();
    expect(field("크기")).toBe("104.9 MB");
    expect(field("형식")).toBe("video/mp4");
    expect(field("상태")).toBe("업로드 완료");
    expect(field("올린 시각")).toBe("2026. 11. 3. 오전 9:00");
    expect(field("업로드 완료 시각")).toBe("2026. 11. 3. 오전 9:05");
  });

  it("[SPEC-006 R-7] 업로드 완료 시각이 없으면 -로 보여 준다", async () => {
    detailServer({ status: "UPLOADING", uploadedAt: null });
    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    await screen.findByText("업로드 완료 시각", { selector: "dt" });
    expect(field("업로드 완료 시각")).toBe("-");
  });

  it.each([
    ["UPLOADING", "업로드가 끝나지 않아 재생할 수 없습니다."],
    ["EXPIRED", "24시간 안에 업로드를 마치지 않아 만료된 영상입니다."],
  ] as const)(
    "[SPEC-006 R-9] %s 영상이면 플레이어 대신 재생할 수 없는 이유를 보여 주고 재생 주소를 요청하지 않는다",
    async (status, reason) => {
      const counter = detailServer({ fileName: "parking.mp4", status });
      renderRoute(`/analysis/videos/${VIDEO_ID}`);

      expect(await screen.findByText(reason)).toBeVisible();
      expect(screen.queryByLabelText("parking.mp4 재생")).not.toBeInTheDocument();
      expect(counter.playbacks).toBe(0);
    },
  );

  it("[SPEC-006 R-12] 영상이 없으면 찾을 수 없다는 안내와 목록으로 돌아가는 링크를 보여 준다", async () => {
    detailServer(() => problem(404, "MEDIA_VIDEO_NOT_FOUND"));
    const { user, router } = renderRoute(`/analysis/videos/${VIDEO_ID}`);

    expect(await screen.findByText("이미 삭제되었거나 찾을 수 없는 영상입니다.")).toBeVisible();
    await user.click(screen.getByRole("link", { name: "목록으로 돌아가기" }));

    // 목록 화면은 lazy로 불러오므로 화면이 바뀐 뒤 주소를 확인한다.
    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/analysis");
  });

  it("[SPEC-006 R-12] 주소의 영상 ID 형식이 틀리면 요청 없이 찾을 수 없다는 안내를 보여 준다", async () => {
    let requested = false;
    detailServer(() => {
      requested = true;
      return problem(404, "MEDIA_VIDEO_NOT_FOUND");
    });
    renderRoute("/analysis/videos/not-a-uuid");

    expect(await screen.findByText("이미 삭제되었거나 찾을 수 없는 영상입니다.")).toBeVisible();
    expect(screen.getByRole("link", { name: "목록으로 돌아가기" })).toBeVisible();
    expect(requested).toBe(false);
  });
});
