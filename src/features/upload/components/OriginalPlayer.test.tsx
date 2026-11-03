import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  handlers,
  MEDIA_API,
  mediaHandlers,
  playbackBody,
  videoBody,
} from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import type { VideoPlayback } from "../model/schemas";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";

/** 업로드가 끝난 영상 하나. 재생 주소는 요청마다 `playbacks`에서 차례로 꺼내 준다. */
function playerServer(playbacks: VideoPlayback[]) {
  const counter = { requests: 0 };
  server.use(
    handlers.me(),
    http.get(`${MEDIA_API}/:id`, () =>
      HttpResponse.json(videoBody({ id: VIDEO_ID, fileName: "parking.mp4", status: "UPLOADED" })),
    ),
    http.get(`${MEDIA_API}/:id/playback`, () => {
      const playback = playbacks[Math.min(counter.requests, playbacks.length - 1)];
      counter.requests++;
      return HttpResponse.json(playback);
    }),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return counter;
}

describe("OriginalPlayer", () => {
  it("[SPEC-006 R-8] 업로드가 끝난 영상이면 재생 주소로 플레이어를 보여 주고 원본 내려받기 링크를 둔다", async () => {
    const playback = playbackBody();
    playerServer([playback]);
    renderRoute(`/analysis/videos/${VIDEO_ID}`);

    const player = await screen.findByLabelText("parking.mp4 재생");
    expect(player.tagName).toBe("VIDEO");
    expect(player).toHaveAttribute("src", playback.url);
    expect(player).toHaveAttribute("controls");
    expect(screen.getByRole("link", { name: "원본 내려받기" })).toHaveAttribute(
      "href",
      playback.downloadUrl,
    );
  });
});
