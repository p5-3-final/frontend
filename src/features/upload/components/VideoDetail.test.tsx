import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, videoBody } from "../../../../mocks/handlers";
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
});
